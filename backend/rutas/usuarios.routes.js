const express = require('express');
const router = express.Router();
const { verificarToken, permitirRol } = require('../middlewares/auth.middleware');
const { registrarAuditoria } = require('../middlewares/auditoria.middleware');
const usuariosController = require('../controladores/usuarios.controller');

const soloAdmin = [verificarToken, permitirRol('administrador')];

router.get('/api/usuarios', ...soloAdmin, usuariosController.listarUsuarios);
router.post('/api/usuarios', ...soloAdmin, registrarAuditoria('crear_usuario'), usuariosController.crearUsuario);
router.put('/api/usuarios/:id', ...soloAdmin, registrarAuditoria('editar_usuario'), usuariosController.editarUsuario);
router.patch('/api/usuarios/:id/desactivar', ...soloAdmin, registrarAuditoria('desactivar_usuario'), usuariosController.desactivarUsuario);

module.exports = router;