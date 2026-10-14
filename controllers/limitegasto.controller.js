const limitegasto = require('../models/limitegasto.model'); // Importa el modelo de limite_gasto

// Crear un nuevo limite de gasto
exports.crear = async (req, res) => {
    try {
        await limitegasto.crear(req.body); // Inserta los datos del body
        res.json({ mensaje: 'limite de gasto creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Maneja errores (ej: fecha duplicada)
    }
};

// Listar todos los limites de gasto activos
exports.listar = async (req, res) => {
    try {
        const data = await limitegasto.listar(); // Obtiene todos los limites de gasto
        res.json(data.rows); // Devuelve solo las filas
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un limite de gasto específico por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await limitegasto.obtenerPorId(req.params.id);
        res.json(data.rows[0]); // Devuelve solo el primer registro
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un limite de gasto existente
exports.actualizar = async (req, res) => {
    try {
        await limitegasto.actualizar(req.params.id, req.body); // Actualiza con el ID de la URL
        res.json({ mensaje: 'limite de gasto actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desactivar limite de gasto (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await limitegasto.desactivar(req.params.id);
        res.json({ mensaje: 'limite de gasto desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar limite de gasto permanentemente (hard delete)
exports.desaparecer = async (req, res) => {
    try {
        await limitegasto.desaparecer(req.params.id);
        res.json({ mensaje: 'limite de gasto eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ error: 'No se puede eliminar: el limite de gasto tiene registros asociados' });
    }
};
