const crypto = require('crypto');

// Generate consistent hash
function hashPassword(password) {
  const salt = 'kpi-nexus-salt-2024';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Verify password
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Test
const password = 'password123';
const hash = hashPassword(password);
console.log('Password:', password);
console.log('Hash:', hash);
console.log('Verification:', verifyPassword(password, hash) ? '✅ PASS' : '❌ FAIL');

// Test consistency
const hash2 = hashPassword(password);
console.log('Consistency test:', hash === hash2 ? '✅ YES' : '❌ NO');
