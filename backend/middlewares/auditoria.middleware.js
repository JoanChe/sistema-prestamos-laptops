const pool = require('../config/db');

exports.registrarAuditoria = (nombreAccion) => (peticion, respuesta, siguiente) => {
  // Se ejecuta cuando el controlador ya respondió
  respuesta.on('finish', async () => {
    const idEntidad = respuesta.locals.id_entidad_auditoria;
    if (respuesta.statusCode >= 400 || !idEntidad) return; // no auditar acciones fallidas

    const entidad = peticion.path.split('/')[2] || 'desconocida'; // ej. /api/reservas/5 -> "reservas"
    try {
      await pool.query(
        `INSERT INTO auditoria (id_usuario, accion, entidad_afectada, id_entidad)
         VALUES ($1, $2, $3, $4)`,
        [peticion.usuario.id_usuario, nombreAccion, entidad, idEntidad]
      );
    } catch (error) {
      console.error('Error registrando auditoría:', error.message);
    }
  });
  siguiente();
};