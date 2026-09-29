const express = require('express');
const pool = require('../db');
const { generarGrupos } = require('../lib/grouping');

const router = express.Router();

router.post('/grados/:gradoId/sorteo', async (req, res) => {
  const { tamanoGrupo } = req.body || {};
  const size = Number(tamanoGrupo);

  if (!Number.isInteger(size) || size < 1) {
    return res.status(400).json({ error: 'El tamaño de grupo debe ser un número entero mayor a 0' });
  }

  const [alumnos] = await pool.query('SELECT id, nombre FROM alumnos WHERE grado_id = ? ORDER BY nombre ASC', [
    req.params.gradoId,
  ]);

  if (alumnos.length === 0) {
    return res.status(400).json({ error: 'Este grado no tiene alumnos registrados' });
  }

  const [restricciones] = await pool.query(
    'SELECT alumno_id_1, alumno_id_2 FROM restricciones WHERE grado_id = ?',
    [req.params.gradoId]
  );

  const resultado = generarGrupos(alumnos, restricciones, size);

  if (!resultado.ok) {
    return res.status(422).json({ error: resultado.error });
  }

  res.json({
    totalAlumnos: alumnos.length,
    tamanoGrupo: size,
    numGrupos: resultado.grupos.length,
    grupos: resultado.grupos,
  });
});

module.exports = router;
