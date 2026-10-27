const express = require('express');
const router = express.Router();
const { verificarToken, permitirRol } = require('../middlewares/auth.middleware');
const { registrarAuditoria } = require('../middlewares/auditoria.middleware');
const entregasController = require('../controladores/entregas.controller');

router.get('/api/reservas/dashboard', verificarToken, permitirRol('soporte', 'administrador'), entregasController.obtenerDashboard);

router.post('/api/entregas', verificarToken, permitirRol('soporte'), registrarAuditoria('registrar_entrega'), entregasController.entregar);
router.post('/api/devoluciones', verificarToken, permitirRol('soporte'), registrarAuditoria('registrar_devolucion'), entregasController.devolver);
router.post('/api/incidencias', verificarToken, permitirRol('soporte'), registrarAuditoria('reportar_incidencia'), entregasController.reportarIncidencia);

router.patch('/api/reservas/:id/cancelar', verificarToken, permitirRol('docente'), registrarAuditoria('cancelar_reserva'), entregasController.cancelar);

module.exports = router;