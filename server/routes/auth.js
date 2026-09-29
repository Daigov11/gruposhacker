const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { usuario, password } = req.body || {};

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  const [rows] = await pool.query('SELECT password_hash FROM admins WHERE usuario = ?', [usuario]);

  if (rows.length > 0) {
    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (match) {
      req.session.isAdmin = true;
      req.session.usuario = usuario;
      return res.json({ ok: true, usuario });
    }
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Fallback para el admin de arranque definido por variables de entorno
  // (útil antes de haber creado algún admin en la tabla `admins`).
  const adminUser = process.env.ADMIN_USER;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (adminUser && adminHash && usuario === adminUser) {
    const match = await bcrypt.compare(password, adminHash);
    if (match) {
      req.session.isAdmin = true;
      req.session.usuario = usuario;
      return res.json({ ok: true, usuario });
    }
  }

  return res.status(401).json({ error: 'Credenciales inválidas' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/session', (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
});

module.exports = router;
