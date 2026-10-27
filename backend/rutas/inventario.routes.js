const express = require('express');
const router = express.Router();
const { verificarToken, permitirRol } = require('../middlewares/auth.middleware');
const { registrarAuditoria } = require('../middlewares/auditoria.middleware');
const inventarioController = require('../controladores/inventario.controller');

const soloAdmin = [verificarToken, permitirRol('administrador')];
const adminOSoporte = [verificarToken, permitirRol('administrador', 'soporte')];

// Racks: soporte puede consultarlos (los necesita al entregar/devolver)
router.get('/api/racks', ...adminOSoporte, inventarioController.listarRacks);
router.post('/api/racks', ...soloAdmin, registrarAuditoria('crear_rack'), inventarioController.crearRack);
router.put('/api/racks/:id', ...soloAdmin, registrarAuditoria('editar_rack'), inventarioController.editarRack);

// Laptops: solo administrador
router.get('/api/laptops', ...soloAdmin, inventarioController.listarLaptops);
router.post('/api/laptops', ...soloAdmin, registrarAuditoria('crear_laptop'), inventarioController.crearLaptop);
router.post('/api/laptops/lote', ...soloAdmin, registrarAuditoria('crear_laptops_lote'), inventarioController.crearLaptopsEnLote);
router.delete('/api/laptops/:id', ...soloAdmin, registrarAuditoria('eliminar_laptop'), inventarioController.eliminarLaptop);

module.exports = router;