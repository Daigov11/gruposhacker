const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.error('Uso: npm run hash-password -- "tu_password"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log('\nCopia este valor en ADMIN_PASSWORD_HASH dentro de tu .env:\n');
  console.log(hash);
  console.log('');
});
