const crypto = require('crypto');

// Generate consistent hash with fixed salt
function hashPassword(password) {
  const salt = 'kpi-nexus-salt-2024';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Verify password
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

module.exports = { hashPassword, verifyPassword };
