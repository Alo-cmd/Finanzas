const express = require('express');
const router = express.Router();
const controller = require('../controllers/limitegasto.controller'); // Importa el controlador

// GET /limitegasto - Listar todos los limites de gasto
router.get('/', controller.listar);

// GET /limitegasto/:id - Obtener un limite de gasto específico
router.get('/:id', controller.obtenerPorId);

// POST /limitegasto - Crear un nuevo limite de gasto
router.post('/', controller.crear);

// PUT /limitegasto/:id - Actualizar un limite de gasto existente
router.put('/:id', controller.actualizar);

// PATCH /limitegasto/:id/desactivar - Desactivar limite de gasto (soft delete)
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /limitegasto/:id - Eliminar limite de gasto permanentemente (hard delete)
router.delete('/:id', controller.desaparecer);

module.exports = router; // Exporta el router para usarlo en app.js
