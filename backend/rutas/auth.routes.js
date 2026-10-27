const express = require('express');
const router = express.Router();
const authController = require('../controladores/auth.controller');

router.post('/api/auth/registro', authController.registrar);
router.post('/api/auth/login', authController.iniciarSesion);

module.exports = router; 