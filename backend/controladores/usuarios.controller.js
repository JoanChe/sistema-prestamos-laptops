const bcrypt = require('bcrypt');
const pool = require('../config/db');

// Listar todos los usuarios (para la tabla del panel admin)
exports.listarUsuarios = async (peticion, respuesta) => {
  const resultado = await pool.query(
    `SELECT u.id_usuario, u.nombre_completo, u.correo, r.nombre_rol, u.activo
     FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol
     ORDER BY u.nombre_completo`
  );
  respuesta.json(resultado.rows);
};

// Crear usuario (docente o soporte) — mismo flujo que el registro, pero ejecutado por el admin
exports.crearUsuario = async (peticion, respuesta) => {
  const { nombre_completo, correo, contrasena, id_rol } = peticion.body;
  try {
    const hash = await bcrypt.hash(contrasena, 10);
    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre_completo, correo, contrasena_hash, id_rol)
       VALUES ($1, $2, $3, $4) RETURNING id_usuario, nombre_completo, correo`,
      [nombre_completo, correo, hash, id_rol]
    );
    respuesta.locals.id_entidad_auditoria = resultado.rows[0].id_usuario;
    respuesta.status(201).json(resultado.rows[0]);
  } catch (error) {
    respuesta.status(400).json({ error: 'No se pudo crear el usuario (¿correo duplicado?).' });
  }
};

// Editar usuario (nombre, correo, rol)
exports.editarUsuario = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nombre_completo, correo, id_rol } = peticion.body;
  try {
    const resultado = await pool.query(
      `UPDATE usuarios SET nombre_completo = $1, correo = $2, id_rol = $3
       WHERE id_usuario = $4 RETURNING id_usuario`,
      [nombre_completo, correo, id_rol, id]
    );
    if (resultado.rows.length === 0) {
      return respuesta.status(404).json({ error: 'Usuario no encontrado.' });
    }
    respuesta.locals.id_entidad_auditoria = id;
    respuesta.json({ mensaje: 'Usuario actualizado.' });
  } catch (error) {
    respuesta.status(400).json({ error: 'Error al actualizar el usuario.' });
  }
};

// Desactivar usuario (RF-03 habla de "desactivar", no de borrar, para no romper el historial de auditoría)
exports.desactivarUsuario = async (peticion, respuesta) => {
  const { id } = peticion.params;
  await pool.query(`UPDATE usuarios SET activo = FALSE WHERE id_usuario = $1`, [id]);
  respuesta.locals.id_entidad_auditoria = id;
  respuesta.json({ mensaje: 'Usuario desactivado.' });
};