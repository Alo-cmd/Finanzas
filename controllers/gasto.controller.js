const gasto = require('../models/gasto.model'); // Importa el modelo de gasto

// Crear un nuevo gasto
exports.crear = async (req, res) => {
    try {
        await gasto.crear(req.body); // Inserta los datos del body
        res.json({ mensaje: 'gasto creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Maneja errores (ej: fk_categoria inexistente)
    }
};

// Crear varios gastos de un solo golpe (alta en lote)
exports.crearVarios = async (req, res) => {
    try {
        const items = req.body.items;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'No hay gastos en la lista para guardar' });
        }
        await gasto.crearVarios(items);
        res.json({ mensaje: `${items.length} gastos creados exitosamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Listar todos los gastos activos
exports.listar = async (req, res) => {
    try {
        const data = await gasto.listar(); // Obtiene todos los gastos
        res.json(data.rows); // Devuelve solo las filas
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un gasto específico por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await gasto.obtenerPorId(req.params.id);
        res.json(data.rows[0]); // Devuelve solo el primer registro
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un gasto existente
exports.actualizar = async (req, res) => {
    try {
        await gasto.actualizar(req.params.id, req.body); // Actualiza con el ID de la URL
        res.json({ mensaje: 'gasto actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desactivar gasto (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await gasto.desactivar(req.params.id);
        res.json({ mensaje: 'gasto desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar gasto permanentemente (hard delete)
exports.desaparecer = async (req, res) => {
    try {
        await gasto.desaparecer(req.params.id);
        res.json({ mensaje: 'gasto eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ error: 'No se puede eliminar: el gasto tiene registros asociados' });
    }
};
