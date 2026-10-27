
const pool = require('../config/db'); // pool de conexiones pg

exports.crearReservaConValidacion = async (datos) => {
  const cliente = await pool.connect();
  try {
    // 1. Apertura de transacción (RNF-09: operación atómica)
    await cliente.query('BEGIN');

    // 2. Bloqueo a nivel de fila sobre el RACK (RF-10)
    //    Bloqueamos la fila del rack asociado al aula. Esto impide que otra
    //    transacción concurrente modifique la capacidad total del rack
    //    mientras estamos calculando la disponibilidad.
    const resultadoRack = await cliente.query(
      `SELECT capacidad_total 
       FROM racks 
       WHERE id_aula_asociada = $1 
       FOR UPDATE`,
      [datos.id_aula]
    );

    // Si no existe un rack asociado al aula, lanzamos un error
    if (resultadoRack.rows.length === 0) {
      throw new Error('No hay un rack asociado a esta aula.');
    }

    const capacidad_total = resultadoRack.rows[0].capacidad_total;

    // 3. Cálculo de laptops ya reservadas en la franja horaria.
    //    Ya no usamos FOR UPDATE aquí porque el rack ya está bloqueado.
    const resultadoReservas = await cliente.query(
      `SELECT COALESCE(SUM(cantidad_laptops), 0) AS reservado
       FROM reservas
       WHERE id_aula = $1
         AND fecha = $2
         AND estado IN ('pendiente', 'entregada')
         AND hora_inicio < $4 AND hora_fin > $3`,
      [datos.id_aula, datos.fecha, datos.hora_inicio, datos.hora_fin]
    );

    const reservado = parseInt(resultadoReservas.rows[0].reservado, 10);
    const disponible = capacidad_total - reservado;

    // 4. Regla de negocio: rechazo si no hay stock suficiente (RF-09)
    if (datos.cantidad_laptops > disponible) {
      await cliente.query('ROLLBACK');
      const error = new Error('Stock insuficiente');
      error.codigo = 'STOCK_INSUFICIENTE';
      throw error;
    }

    // 5. Inserción de la reserva dentro de la misma transacción
    const insercion = await cliente.query(
      `INSERT INTO reservas (id_docente, id_aula, fecha, hora_inicio, hora_fin, cantidad_laptops, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
       RETURNING id_reserva, estado`,
      [datos.id_docente, datos.id_aula, datos.fecha, datos.hora_inicio, datos.hora_fin, datos.cantidad_laptops]
    );

    // 6. Confirmación de la transacción: libera el bloqueo de fila
    await cliente.query('COMMIT');

    return insercion.rows[0];

  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    cliente.release(); // devuelve la conexión al pool
  }
};

exports.listarReservasDeDocente = async (idDocente) => {
  const resultado = await pool.query(
    `SELECT r.id_reserva, r.fecha, r.hora_inicio, r.hora_fin, r.cantidad_laptops, r.estado, a.nombre_aula
     FROM reservas r
     JOIN aulas a ON r.id_aula = a.id_aula
     WHERE r.id_docente = $1
     ORDER BY r.fecha DESC, r.hora_inicio DESC`,
    [idDocente]
  );
  return resultado.rows;
};