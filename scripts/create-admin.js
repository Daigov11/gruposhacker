require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../server/db');

async function main() {
  const usuario = process.argv[2];
  const password = process.argv[3];

  if (!usuario || !password) {
    console.error('Uso: npm run create-admin -- <usuario> <password>');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO admins (usuario, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [usuario, hash]
  );

  console.log(`Admin "${usuario}" creado/actualizado correctamente.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Error creando admin:', err.message);
  process.exit(1);
});
