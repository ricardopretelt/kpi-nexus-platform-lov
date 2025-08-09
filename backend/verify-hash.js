const crypto = require('crypto');

// Your exact hash function
function hashPassword(password) {
  const salt = 'kpi-nexus-salt-2024';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Test with your password
const password = 'password123';
const correctHash = hashPassword(password);

console.log('=== HASH VERIFICATION ===');
console.log('Password:', password);
console.log('Salt:', 'kpi-nexus-salt-2024');
console.log('Combined string:', password + 'kpi-nexus-salt-2024');
console.log('Correct hash:', correctHash);
console.log('Current schema hash:', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
console.log('Hashes match:', correctHash === '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');

console.log('\n=== CORRECTED SCHEMA INSERT ===');
console.log(`INSERT INTO users (username, email, password_hash, full_name, role, is_admin) VALUES`);
console.log(`('john.doe', 'john.doe@company.com', '${correctHash}', 'John Doe', 'admin', 't');`);