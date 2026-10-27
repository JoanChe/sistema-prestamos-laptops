const entregasService = require('../servicios/entregas.service');

exports.obtenerDashboard = async (peticion, respuesta) => {
  try {
    const { fecha, id_aula, estado } = peticion.query;
    const reservas = await entregasService.listarReservasDashboard({ fecha, id_aula, estado });
    respuesta.json(reservas);
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: 'Error al consultar el dashboard.' });
  }
};

exports.entregar = async (peticion, respuesta) => {
  try {
    const { id_reserva, id_rack } = peticion.body;
    const resultado = await entregasService.registrarEntrega(id_reserva, id_rack, peticion.usuario.id_usuario);
    respuesta.locals.id_entidad_auditoria = id_reserva;
    respuesta.status(201).json(resultado);
  } catch (error) {
    if (error.codigo === 'NO_ENCONTRADA') return respuesta.status(404).json({ error: error.message });
    if (error.codigo === 'ESTADO_INVALIDO') return respuesta.status(409).json({ error: error.message });
    console.error(error);
    respuesta.status(500).json({ error: 'Error al registrar la entrega.' });
  }
};

exports.devolver = async (peticion, respuesta) => {
  try {
    const { id_reserva, id_rack } = peticion.body;
    const resultado = await entregasService.registrarDevolucion(id_reserva, id_rack, peticion.usuario.id_usuario);
    respuesta.locals.id_entidad_auditoria = id_reserva;
    respuesta.status(201).json(resultado);
  } catch (error) {
    if (error.codigo === 'NO_ENCONTRADA') return respuesta.status(404).json({ error: error.message });
    if (error.codigo === 'ESTADO_INVALIDO') return respuesta.status(409).json({ error: error.message });
    console.error(error);
    respuesta.status(500).json({ error: 'Error al registrar la devolución.' });
  }
};

exports.reportarIncidencia = async (peticion, respuesta) => {
  try {
    const resultado = await entregasService.registrarIncidencia(peticion.body, peticion.usuario.id_usuario);
    respuesta.locals.id_entidad_auditoria = resultado.id_incidencia;
    respuesta.status(201).json(resultado);
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: 'Error al registrar la incidencia.' });
  }
};

exports.cancelar = async (peticion, respuesta) => {
  try {
    const { id } = peticion.params;
    const resultado = await entregasService.cancelarReserva(id, peticion.usuario.id_usuario);
    respuesta.locals.id_entidad_auditoria = id;
    respuesta.json({ mensaje: 'Reserva cancelada.', reserva: resultado });
  } catch (error) {
    if (error.codigo === 'NO_CANCELABLE') return respuesta.status(409).json({ error: error.message });
    console.error(error);
    respuesta.status(500).json({ error: 'Error al cancelar la reserva.' });
  }
};