const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node generate-hash.js <password>');
  console.log('Example: node generate-hash.js mypassword');
  process.exit(1);
}

console.log('=== Password Hash Generator ===');

// Generate bcrypt hash
const hash = bcrypt.hashSync(password, 10);
console.log('Generated hash:', hash);

// Encode to base64 to avoid environment variable issues with special characters
const encoded = Buffer.from(hash).toString('base64');

// Verify the hash works
const isValid = bcrypt.compareSync(password, hash);
console.log('Hash verification:', isValid ? '✅ PASSED' : '❌ FAILED');

console.log('\n=== Add to .env.local ===');
console.log(`ADMIN_PASSWORD_HASH_ENCODED=${encoded}`);

if (!isValid) {
  console.log('\n❌ ERROR: Hash verification failed!');
  process.exit(1);
}

console.log('\n✅ Hash generated successfully!');