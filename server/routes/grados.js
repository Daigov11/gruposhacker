const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.id, g.nombre, g.created_at, COUNT(a.id) AS total_alumnos
     FROM grados g
     LEFT JOIN alumnos a ON a.grado_id = g.id
     GROUP BY g.id
     ORDER BY g.nombre ASC`
  );
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del grado es requerido' });
  }
  const [result] = await pool.query('INSERT INTO grados (nombre) VALUES (?)', [nombre.trim()]);
  res.status(201).json({ id: result.insertId, nombre: nombre.trim() });
});

router.put('/:id', requireAuth, async (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del grado es requerido' });
  }
  await pool.query('UPDATE grados SET nombre = ? WHERE id = ?', [nombre.trim(), req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM grados WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
