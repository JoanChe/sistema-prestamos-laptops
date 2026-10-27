const jwt = require('jsonwebtoken');

exports.verificarToken = (peticion, respuesta, siguiente) => {
  const encabezado = peticion.headers['authorization'];
  if (!encabezado) return respuesta.status(401).json({ error: 'Token no proporcionado.' });

  const token = encabezado.split(' ')[1];
  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    peticion.usuario = decodificado;
    siguiente();
  } catch (error) {
    return respuesta.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

exports.permitirRol = (...rolesPermitidos) => (peticion, respuesta, siguiente) => {
  if (!rolesPermitidos.includes(peticion.usuario.rol)) {
    return respuesta.status(403).json({ error: 'No autorizado para esta acción.' });
  }
  siguiente();
};