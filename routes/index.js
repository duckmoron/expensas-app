// expensas-app\routes\index.js
const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const unidadesController = require('../controllers/unidadesController');

// Rutas Principales
router.get('/', mainController.index);
router.post('/procesar-pdf', mainController.procesarPdf);

// Rutas de Unidades
router.get('/detalle/:uni', unidadesController.detalle);
router.post('/guardar-documentacion', unidadesController.guardarDocumentacion);
router.post('/eliminar-imagen', unidadesController.eliminarImagen);

module.exports = router;
