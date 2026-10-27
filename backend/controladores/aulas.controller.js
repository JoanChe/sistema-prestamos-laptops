const pool = require('../config/db');

exports.listarAulas = async (peticion, respuesta) => {
  try {
    const resultado = await pool.query(
      `SELECT id_aula, nombre_aula, ubicacion FROM aulas ORDER BY nombre_aula`
    );
    respuesta.json(resultado.rows);
  } catch (error) {
    console.error(error);
    respuesta.status(500).json({ error: 'Error al consultar las aulas.' });
  }
};

// ...(mantén listarAulas que ya está)

exports.crearAula = async (peticion, respuesta) => {
  const { nombre_aula, ubicacion } = peticion.body;
  const resultado = await pool.query(
    `INSERT INTO aulas (nombre_aula, ubicacion) VALUES ($1, $2) RETURNING id_aula`,
    [nombre_aula, ubicacion]
  );
  respuesta.locals.id_entidad_auditoria = resultado.rows[0].id_aula;
  respuesta.status(201).json(resultado.rows[0]);
};

exports.editarAula = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nombre_aula, ubicacion } = peticion.body;
  await pool.query(
    `UPDATE aulas SET nombre_aula = $1, ubicacion = $2 WHERE id_aula = $3`,
    [nombre_aula, ubicacion, id]
  );
  respuesta.locals.id_entidad_auditoria = id;
  respuesta.json({ mensaje: 'Aula actualizada.' });
};

exports.eliminarAula = async (peticion, respuesta) => {
  const { id } = peticion.params;
  try {
    await pool.query(`DELETE FROM aulas WHERE id_aula = $1`, [id]);
    respuesta.locals.id_entidad_auditoria = id;
    respuesta.json({ mensaje: 'Aula eliminada.' });
  } catch (error) {
    // Si el aula tiene racks o reservas asociadas, la FK impide el borrado
    respuesta.status(409).json({ error: 'No se puede eliminar: el aula tiene racks o reservas asociadas.' });
  }
};