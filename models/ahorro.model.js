const Conexion = require('../config/conexion'); // Importa la conexión a PostgreSQL

module.exports = {
    // Crear un nuevo ahorro
    crear: (data) => Conexion.query(
        'INSERT INTO ahorro(nombre_ahorro, monto, descripcion) VALUES($1, $2, $3)',
        [data.nombre_ahorro, data.monto, data.descripcion]
    ),

    // Listar todos los ahorros activos (status = TRUE)
    listar: () => Conexion.query(
        'SELECT * FROM ahorro WHERE status = TRUE ORDER BY pk_ahorro ASC'
    ),

    // Obtener un ahorro por su ID
    obtenerPorId: (id) => Conexion.query(
        'SELECT * FROM ahorro WHERE pk_ahorro = $1 AND status = TRUE',
        [id]
    ),

    // Actualizar datos de un ahorro
    actualizar: (id, data) => Conexion.query(
        'UPDATE ahorro SET nombre_ahorro=$1, monto=$2, descripcion=$3 WHERE pk_ahorro=$4',
        [data.nombre_ahorro, data.monto, data.descripcion, id]
    ),

    // Desactivar ahorro (soft delete - cambiar estado a FALSE)
    desactivar: (id) => Conexion.query(
        'UPDATE ahorro SET status=FALSE WHERE pk_ahorro=$1',
        [id]
    ),

    // Eliminar ahorro permanentemente (hard delete)
    desaparecer: (id) => Conexion.query(
        'DELETE FROM ahorro WHERE pk_ahorro=$1',
        [id]
    )
};
