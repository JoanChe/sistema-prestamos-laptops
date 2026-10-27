const express = require('express');
const router = express.Router();
const { verificarToken, permitirRol } = require('../middlewares/auth.middleware');
const reportesController = require('../controladores/reportes.controller');

router.get(
  '/api/reportes',
  verificarToken, permitirRol('administrador', 'soporte'),
  reportesController.obtenerReporte
);

module.exports = router;