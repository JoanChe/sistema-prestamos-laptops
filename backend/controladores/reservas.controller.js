const reservasService = require('../servicios/reservas.service');

exports.crearReserva = async (peticion, respuesta) => {
  try {
    const { id_aula, fecha, hora_inicio, hora_fin, cantidad_laptops } = peticion.body;
    const id_docente = peticion.usuario.id_usuario;

    if (hora_fin <= hora_inicio || cantidad_laptops <= 0) {
      return respuesta.status(400).json({ error: 'Datos de reserva inválidos.' });
    }

    const reserva = await reservasService.crearReservaConValidacion({
      id_docente, id_aula, fecha, hora_inicio, hora_fin, cantidad_laptops
    });

    respuesta.locals.id_entidad_auditoria = reserva.id_reserva;
    return respuesta.status(201).json(reserva);

  } catch (error) {
    if (error.codigo === 'STOCK_INSUFICIENTE') {
      return respuesta.status(409).json({ error: 'No hay disponibilidad en la franja solicitada.' });
    }
    if (error.codigo === 'SIN_RACKS') {
      return respuesta.status(422).json({ error: 'El aula seleccionada no tiene racks de laptops configurados.' });
    }
    console.error(error);
    return respuesta.status(500).json({ error: 'Error interno del servidor.' });
  }
};

exports.listarMisReservas = async (peticion, respuesta) => {
  try {
    const reservas = await reservasService.listarReservasDeDocente(peticion.usuario.id_usuario);
    respuesta.json(reservas);
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: 'Error al consultar tus reservas.' });
  }
};