const pool = require('../config/db');

// Mapa blanco de agrupaciones permitidas (evita inyección SQL vía el parámetro agrupar_por)
const COLUMNAS_AGRUPACION = {
  docente: { columna: 'u.nombre_completo', etiqueta: 'Docente' },
  aula: { columna: 'a.nombre_aula', etiqueta: 'Aula' },
  franja: { columna: `r.hora_inicio || ' - ' || r.hora_fin`, etiqueta: 'Franja horaria' },
  rack: { columna: 'k.nombre_rack', etiqueta: 'Rack' },
  soporte: { columna: 'us.nombre_completo', etiqueta: 'Usuario de soporte' }
};

exports.generarReporteUso = async ({ agrupar_por, fecha_inicio, fecha_fin }) => {
  const config = COLUMNAS_AGRUPACION[agrupar_por];
  if (!config) {
    const error = new Error('Parámetro agrupar_por inválido.');
    error.codigo = 'PARAMETRO_INVALIDO';
    throw error;
  }

  const valores = [];
  const condiciones = [];

  if (fecha_inicio) {
    valores.push(fecha_inicio);
    condiciones.push(`r.fecha >= $${valores.length}`);
  }
  if (fecha_fin) {
    valores.push(fecha_fin);
    condiciones.push(`r.fecha <= $${valores.length}`);
  }
  const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  // Para agrupar por rack o por soporte, el dato viene de entregas_devoluciones
  const necesitaEntregas = ['rack', 'soporte'].includes(agrupar_por);

  const consulta = necesitaEntregas
    ? `SELECT ${config.columna} AS etiqueta, COUNT(DISTINCT r.id_reserva) AS total_reservas,
              COALESCE(SUM(r.cantidad_laptops), 0) AS total_laptops_prestadas
       FROM reservas r
       JOIN usuarios u ON r.id_docente = u.id_usuario
       JOIN aulas a ON r.id_aula = a.id_aula
       JOIN entregas_devoluciones ed ON ed.id_reserva = r.id_reserva AND ed.tipo = 'entrega'
       JOIN racks k ON ed.id_rack = k.id_rack
       JOIN usuarios us ON ed.id_usuario_soporte = us.id_usuario
       ${whereClause}
       GROUP BY ${config.columna}
       ORDER BY total_reservas DESC`
    : `SELECT ${config.columna} AS etiqueta, COUNT(DISTINCT r.id_reserva) AS total_reservas,
              COALESCE(SUM(r.cantidad_laptops), 0) AS total_laptops_prestadas
       FROM reservas r
       JOIN usuarios u ON r.id_docente = u.id_usuario
       JOIN aulas a ON r.id_aula = a.id_aula
       ${whereClause}
       GROUP BY ${config.columna}
       ORDER BY total_reservas DESC`;

  const resultado = await pool.query(consulta, valores);
  return { etiquetaColumna: config.etiqueta, filas: resultado.rows };
};