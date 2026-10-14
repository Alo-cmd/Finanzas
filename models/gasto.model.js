const Conexion = require('../config/conexion'); // Importa la conexión a PostgreSQL

module.exports = {
    // Crear un nuevo gasto
    crear: (data) => Conexion.query(
        'INSERT INTO gasto(nombre_gasto, total, description, cantidad, precio, fk_categoria) VALUES($1, $2, $3, $4, $5, $6)',
        [data.nombre_gasto, data.total, data.description, data.cantidad, data.precio, data.fk_categoria]
    ),

    // Crear varios gastos de un solo golpe (alta en lote / bulk insert)
    // Arma un único INSERT con varias filas de VALUES en vez de repetir la consulta
    crearVarios: (items) => {
        const COLUMNAS = 6; // nombre_gasto, total, description, cantidad, precio, fk_categoria
        const valores = [];

        const filas = items.map((item, i) => {
            const base = i * COLUMNAS;
            valores.push(item.nombre_gasto, item.total, item.description, item.cantidad, item.precio, item.fk_categoria);
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
        }).join(', ');

        return Conexion.query(
            `INSERT INTO gasto(nombre_gasto, total, description, cantidad, precio, fk_categoria) VALUES ${filas}`,
            valores
        );
    },

    // Listar todos los gastos activos (status = TRUE)
    // Se hace JOIN con categoria para traer el nombre de la categoria (llave foránea)
    listar: () => Conexion.query(
        `SELECT g.*, c.nombre_categoria
         FROM gasto g
         LEFT JOIN categoria c ON g.fk_categoria = c.pk_categoria
         WHERE g.status = TRUE
         ORDER BY g.pk_gasto ASC`
    ),

    // Obtener un gasto por su ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT g.*, c.nombre_categoria
         FROM gasto g
         LEFT JOIN categoria c ON g.fk_categoria = c.pk_categoria
         WHERE g.pk_gasto = $1 AND g.status = TRUE`,
        [id]
    ),

    // Actualizar datos de un gasto
    actualizar: (id, data) => Conexion.query(
        'UPDATE gasto SET nombre_gasto=$1, total=$2, description=$3, cantidad=$4, precio=$5, fk_categoria=$6 WHERE pk_gasto=$7',
        [data.nombre_gasto, data.total, data.description, data.cantidad, data.precio, data.fk_categoria, id]
    ),

    // Desactivar gasto (soft delete - cambiar estado a FALSE)
    desactivar: (id) => Conexion.query(
        'UPDATE gasto SET status=FALSE WHERE pk_gasto=$1',
        [id]
    ),

    // Eliminar gasto permanentemente (hard delete)
    desaparecer: (id) => Conexion.query(
        'DELETE FROM gasto WHERE pk_gasto=$1',
        [id]
    )
};
