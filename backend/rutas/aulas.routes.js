const express = require('express');
const router = express.Router();
const { verificarToken, permitirRol } = require('../middlewares/auth.middleware');
const { registrarAuditoria } = require('../middlewares/auditoria.middleware');
const aulasController = require('../controladores/aulas.controller');

router.get('/api/aulas', verificarToken, aulasController.listarAulas);
router.post('/api/aulas', verificarToken, permitirRol('administrador'), registrarAuditoria('crear_aula'), aulasController.crearAula);
router.put('/api/aulas/:id', verificarToken, permitirRol('administrador'), registrarAuditoria('editar_aula'), aulasController.editarAula);
router.delete('/api/aulas/:id', verificarToken, permitirRol('administrador'), registrarAuditoria('eliminar_aula'), aulasController.eliminarAula);

module.exports = router;