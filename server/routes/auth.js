const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { usuario, password } = req.body || {};

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  const adminUser = process.env.ADMIN_USER;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUser || !adminHash) {
    return res.status(500).json({ error: 'El servidor no tiene configurado el admin (ADMIN_USER/ADMIN_PASSWORD_HASH)' });
  }

  if (usuario !== adminUser) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const match = await bcrypt.compare(password, adminHash);
  if (!match) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  req.session.isAdmin = true;
  req.session.usuario = usuario;
  res.json({ ok: true, usuario });
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
