const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node generate-hash.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('Password hash:');
console.log(hash);
console.log('\nAdd this to your .env file:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);