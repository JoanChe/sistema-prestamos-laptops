const express = require('express');
const router = express.Router();
const { verificarToken, permitirRol } = require('../middlewares/auth.middleware');
const { registrarAuditoria } = require('../middlewares/auditoria.middleware');
const reservasController = require('../controladores/reservas.controller');

router.post('/api/reservas', verificarToken, permitirRol('docente'), registrarAuditoria('creacion_reserva'), reservasController.crearReserva);
router.get('/api/reservas/mias', verificarToken, permitirRol('docente'), reservasController.listarMisReservas);

module.exports = router;
