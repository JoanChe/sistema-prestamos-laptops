const pool = require('../config/db');

// RF-12: dashboard diario/semanal de reservas para el personal de soporte
exports.listarReservasDashboard = async (filtros) => {
  const { fecha, id_aula, estado } = filtros;
  const condiciones = [];
  const valores = [];

  if (fecha) {
    valores.push(fecha);
    condiciones.push(`r.fecha = $${valores.length}`);
  }
  if (id_aula) {
    valores.push(id_aula);
    condiciones.push(`r.id_aula = $${valores.length}`);
  }
  if (estado) {
    valores.push(estado);
    condiciones.push(`r.estado = $${valores.length}`);
  }

  const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const resultado = await pool.query(
    `SELECT r.id_reserva, r.fecha, r.hora_inicio, r.hora_fin, r.cantidad_laptops, r.estado,
            u.nombre_completo AS docente, a.nombre_aula
     FROM reservas r
     JOIN usuarios u ON r.id_docente = u.id_usuario
     JOIN aulas a ON r.id_aula = a.id_aula
     ${whereClause}
     ORDER BY r.fecha, r.hora_inicio`,
    valores
  );
  return resultado.rows;
};

// RF-13: registrar entrega
exports.registrarEntrega = async (idReserva, idRack, idUsuarioSoporte) => {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const reserva = await cliente.query(
      `SELECT id_reserva, estado FROM reservas WHERE id_reserva = $1 FOR UPDATE`,
      [idReserva]
    );

    if (reserva.rows.length === 0) {
      await cliente.query('ROLLBACK');
      const error = new Error('Reserva no encontrada');
      error.codigo = 'NO_ENCONTRADA';
      throw error;
    }

    if (reserva.rows[0].estado !== 'pendiente') {
      await cliente.query('ROLLBACK');
      const error = new Error('La reserva no está en estado pendiente');
      error.codigo = 'ESTADO_INVALIDO';
      throw error;
    }

    await cliente.query(
      `INSERT INTO entregas_devoluciones (id_reserva, tipo, id_usuario_soporte, id_rack)
       VALUES ($1, 'entrega', $2, $3)`,
      [idReserva, idUsuarioSoporte, idRack]
    );

    await cliente.query(
      `UPDATE reservas SET estado = 'entregada' WHERE id_reserva = $1`,
      [idReserva]
    );

    await cliente.query('COMMIT');
    return { mensaje: 'Entrega registrada correctamente.' };

  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
};

// RF-14: registrar devolución (puede ejecutarla un usuario de soporte distinto al que entregó)
exports.registrarDevolucion = async (idReserva, idRack, idUsuarioSoporte) => {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const reserva = await cliente.query(
      `SELECT id_reserva, estado FROM reservas WHERE id_reserva = $1 FOR UPDATE`,
      [idReserva]
    );

    if (reserva.rows.length === 0) {
      await cliente.query('ROLLBACK');
      const error = new Error('Reserva no encontrada');
      error.codigo = 'NO_ENCONTRADA';
      throw error;
    }

    if (reserva.rows[0].estado !== 'entregada') {
      await cliente.query('ROLLBACK');
      const error = new Error('La reserva no está en estado entregada');
      error.codigo = 'ESTADO_INVALIDO';
      throw error;
    }

    await cliente.query(
      `INSERT INTO entregas_devoluciones (id_reserva, tipo, id_usuario_soporte, id_rack)
       VALUES ($1, 'devolucion', $2, $3)`,
      [idReserva, idUsuarioSoporte, idRack]
    );

    await cliente.query(
      `UPDATE reservas SET estado = 'devuelta' WHERE id_reserva = $1`,
      [idReserva]
    );

    await cliente.query('COMMIT');
    return { mensaje: 'Devolución registrada correctamente.' };

  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
};

// RF-15: reportar incidencia
exports.registrarIncidencia = async (datos, idUsuarioReporta) => {
  const { id_reserva, id_laptop, tipo_incidencia, descripcion } = datos;

  const resultado = await pool.query(
    `INSERT INTO incidencias (id_reserva, id_laptop, id_usuario_reporta, tipo_incidencia, descripcion)
     VALUES ($1, $2, $3, $4, $5) RETURNING id_incidencia`,
    [id_reserva, id_laptop || null, idUsuarioReporta, tipo_incidencia, descripcion]
  );

  // Si es daño o pérdida, el equipo deja de estar disponible
  if (id_laptop && ['daño', 'perdida'].includes(tipo_incidencia)) {
    await pool.query(`UPDATE laptops SET estado = 'en_incidencia' WHERE id_laptop = $1`, [id_laptop]);
  }

  return resultado.rows[0];
};

// RF-08: cancelar reserva (solo si no ha iniciado su franja)
exports.cancelarReserva = async (idReserva, idDocente) => {
  const resultado = await pool.query(
    `UPDATE reservas
     SET estado = 'cancelada'
     WHERE id_reserva = $1 AND id_docente = $2 AND estado = 'pendiente'
       AND (fecha > CURRENT_DATE OR (fecha = CURRENT_DATE AND hora_inicio > LOCALTIME))
     RETURNING id_reserva`,
    [idReserva, idDocente]
  );

  if (resultado.rows.length === 0) {
    const error = new Error('No se puede cancelar: la reserva no existe, no es tuya, ya inició o no está pendiente.');
    error.codigo = 'NO_CANCELABLE';
    throw error;
  }

  return resultado.rows[0];
};