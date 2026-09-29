const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Devuelve las restricciones agrupadas por batch_id, cada una con los alumnos involucrados
router.get('/grados/:gradoId/restricciones', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.batch_id, r.alumno_id_1, r.alumno_id_2, a1.nombre AS nombre_1, a2.nombre AS nombre_2
     FROM restricciones r
     JOIN alumnos a1 ON a1.id = r.alumno_id_1
     JOIN alumnos a2 ON a2.id = r.alumno_id_2
     WHERE r.grado_id = ?
     ORDER BY r.created_at ASC`,
    [req.params.gradoId]
  );

  const grupos = new Map();
  for (const row of rows) {
    if (!grupos.has(row.batch_id)) {
      grupos.set(row.batch_id, { batchId: row.batch_id, alumnos: new Map() });
    }
    const grupo = grupos.get(row.batch_id);
    grupo.alumnos.set(row.alumno_id_1, row.nombre_1);
    grupo.alumnos.set(row.alumno_id_2, row.nombre_2);
  }

  const resultado = Array.from(grupos.values()).map((g) => ({
    batchId: g.batchId,
    alumnos: Array.from(g.alumnos.entries()).map(([id, nombre]) => ({ id, nombre })),
  }));

  res.json(resultado);
});

// Crea un conjunto de restricciones mutuas entre 2 o más alumnos (todas las combinaciones por pares)
router.post('/grados/:gradoId/restricciones', requireAuth, async (req, res) => {
  const { alumnoIds } = req.body || {};
  if (!Array.isArray(alumnoIds) || alumnoIds.length < 2) {
    return res.status(400).json({ error: 'Selecciona al menos 2 alumnos para crear una restricción' });
  }

  const ids = [...new Set(alumnoIds.map(Number))];
  const batchId = crypto.randomUUID();
  const pares = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const [a, b] = ids[i] < ids[j] ? [ids[i], ids[j]] : [ids[j], ids[i]];
      pares.push([req.params.gradoId, batchId, a, b]);
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const par of pares) {
      await conn.query(
        `INSERT INTO restricciones (grado_id, batch_id, alumno_id_1, alumno_id_2)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE batch_id = batch_id`,
        par
      );
    }
    await conn.commit();
    res.status(201).json({ ok: true, batchId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'No se pudo crear la restricción' });
  } finally {
    conn.release();
  }
});

router.delete('/restricciones/:batchId', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM restricciones WHERE batch_id = ?', [req.params.batchId]);
  res.json({ ok: true });
});

module.exports = router;
