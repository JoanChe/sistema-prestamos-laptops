const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.registrar = async (peticion, respuesta) => {
  const { nombre_completo, correo, contrasena, id_rol } = peticion.body;
  const hash = await bcrypt.hash(contrasena, 10);
  try {
    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre_completo, correo, contrasena_hash, id_rol)
       VALUES ($1, $2, $3, $4) RETURNING id_usuario, nombre_completo, correo`,
      [nombre_completo, correo, hash, id_rol]
    );
    respuesta.status(201).json(resultado.rows[0]);
  } catch (error) {
    respuesta.status(400).json({ error: 'No se pudo registrar el usuario (¿correo duplicado?).' });
  }
};

exports.iniciarSesion = async (peticion, respuesta) => {
  const { correo, contrasena } = peticion.body;
  const resultado = await pool.query(
    `SELECT u.id_usuario, u.contrasena_hash, r.nombre_rol
     FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol
     WHERE u.correo = $1 AND u.activo = TRUE`,
    [correo]
  );

  if (resultado.rows.length === 0) {
    return respuesta.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const usuario = resultado.rows[0];
  const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!coincide) {
    return respuesta.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, rol: usuario.nombre_rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  respuesta.json({ token });
};