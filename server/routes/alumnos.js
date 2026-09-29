const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/grados/:gradoId/alumnos', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, grado_id, nombre FROM alumnos WHERE grado_id = ? ORDER BY nombre ASC',
    [req.params.gradoId]
  );
  res.json(rows);
});

router.post('/grados/:gradoId/alumnos', requireAuth, async (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del alumno es requerido' });
  }
  const [result] = await pool.query('INSERT INTO alumnos (grado_id, nombre) VALUES (?, ?)', [
    req.params.gradoId,
    nombre.trim(),
  ]);
  res.status(201).json({ id: result.insertId, grado_id: Number(req.params.gradoId), nombre: nombre.trim() });
});

router.put('/alumnos/:id', requireAuth, async (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del alumno es requerido' });
  }
  await pool.query('UPDATE alumnos SET nombre = ? WHERE id = ?', [nombre.trim(), req.params.id]);
  res.json({ ok: true });
});

router.delete('/alumnos/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM alumnos WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
