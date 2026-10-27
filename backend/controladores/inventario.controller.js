const pool = require('../config/db');

// --- RACKS ---
exports.listarRacks = async (peticion, respuesta) => {
  const resultado = await pool.query(
    `SELECT k.id_rack, k.nombre_rack, k.ubicacion, k.capacidad_total, a.nombre_aula
     FROM racks k LEFT JOIN aulas a ON k.id_aula_asociada = a.id_aula
     ORDER BY k.nombre_rack`
  );
  respuesta.json(resultado.rows);
};

exports.crearRack = async (peticion, respuesta) => {
  const { nombre_rack, ubicacion, capacidad_total, id_aula_asociada } = peticion.body;
  const resultado = await pool.query(
    `INSERT INTO racks (nombre_rack, ubicacion, capacidad_total, id_aula_asociada)
     VALUES ($1, $2, $3, $4) RETURNING id_rack`,
    [nombre_rack, ubicacion, capacidad_total, id_aula_asociada]
  );
  respuesta.locals.id_entidad_auditoria = resultado.rows[0].id_rack;
  respuesta.status(201).json(resultado.rows[0]);
};

exports.editarRack = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nombre_rack, ubicacion, capacidad_total } = peticion.body;
  await pool.query(
    `UPDATE racks SET nombre_rack = $1, ubicacion = $2, capacidad_total = $3 WHERE id_rack = $4`,
    [nombre_rack, ubicacion, capacidad_total, id]
  );
  respuesta.locals.id_entidad_auditoria = id;
  respuesta.json({ mensaje: 'Rack actualizado.' });
};

// --- LAPTOPS (cantidad de equipos, RF relacionado a stock) ---
exports.listarLaptops = async (peticion, respuesta) => {
  const resultado = await pool.query(
    `SELECT l.id_laptop, l.codigo_inventario, l.estado, k.nombre_rack
     FROM laptops l LEFT JOIN racks k ON l.id_rack = k.id_rack
     ORDER BY l.codigo_inventario`
  );
  respuesta.json(resultado.rows);
};

// Dar de alta una laptop individual
exports.crearLaptop = async (peticion, respuesta) => {
  const { codigo_inventario, id_rack } = peticion.body;
  try {
    const resultado = await pool.query(
      `INSERT INTO laptops (codigo_inventario, id_rack, estado)
       VALUES ($1, $2, 'disponible') RETURNING id_laptop`,
      [codigo_inventario, id_rack]
    );
    respuesta.locals.id_entidad_auditoria = resultado.rows[0].id_laptop;
    respuesta.status(201).json(resultado.rows[0]);
  } catch (error) {
    respuesta.status(400).json({ error: 'Código de inventario duplicado o rack inválido.' });
  }
};

// Dar de alta varias laptops a la vez (p. ej. "agregar 10 laptops al Rack-A1")
exports.crearLaptopsEnLote = async (peticion, respuesta) => {
  const { id_rack, cantidad, prefijo_codigo } = peticion.body;
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const laptopsCreadas = [];
    for (let i = 1; i <= cantidad; i++) {
      const codigo = `${prefijo_codigo}-${Date.now()}-${i}`;
      const resultado = await cliente.query(
        `INSERT INTO laptops (codigo_inventario, id_rack, estado)
         VALUES ($1, $2, 'disponible') RETURNING id_laptop, codigo_inventario`,
        [codigo, id_rack]
      );
      laptopsCreadas.push(resultado.rows[0]);
    }
    await cliente.query('COMMIT');
    respuesta.status(201).json({ mensaje: `${cantidad} laptops creadas.`, laptops: laptopsCreadas });
  } catch (error) {
    await cliente.query('ROLLBACK');
    respuesta.status(400).json({ error: 'Error al crear las laptops en lote.' });
  } finally {
    cliente.release();
  }
};

exports.eliminarLaptop = async (peticion, respuesta) => {
  const { id } = peticion.params;
  try {
    await pool.query(`DELETE FROM laptops WHERE id_laptop = $1`, [id]);
    respuesta.locals.id_entidad_auditoria = id;
    respuesta.json({ mensaje: 'Laptop eliminada del inventario.' });
  } catch (error) {
    respuesta.status(409).json({ error: 'No se puede eliminar: la laptop tiene incidencias registradas.' });
  }
};