// expensas-app\routes\index.js
const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const unidadesController = require('../controllers/unidadesController');
const estadisticasController = require('../controllers/estadisticasController');
const proveedoresController = require('../controllers/proveedoresController');

// Rutas Principales
router.get('/', mainController.index);
router.post('/procesar-pdf', mainController.procesarPdf);
router.get('/estadisticas', estadisticasController.index);
router.get('/datos-importantes', mainController.datosImportantes);
router.get('/proveedores', proveedoresController.index);
router.get('/proveedores/nuevo', proveedoresController.nuevo);
router.post('/proveedores/nuevo', proveedoresController.guardar);
router.get('/proveedores/editar/:id', proveedoresController.editar);
router.post('/proveedores/editar/:id', proveedoresController.actualizar);
router.post('/proveedores/eliminar/:id', proveedoresController.eliminar);

// Rutas de Unidades
router.get('/detalle/:uni', unidadesController.detalle);
router.post('/guardar-documentacion', unidadesController.guardarDocumentacion);
router.post('/eliminar-imagen', unidadesController.eliminarImagen);

module.exports = router;
