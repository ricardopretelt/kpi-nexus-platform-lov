const { Pool } = require('pg');
const { hashPassword, verifyPassword } = require('./consistent-hash');

// Use environment variables or Docker-compose defaults
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kpi_nexus',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function fixPasswords() {
  try {
    console.log('=== FIXING PASSWORDS WITH CORRECT SHA256 HASH ===');
    
    const password = 'password123';
    const correctHash = hashPassword(password);
    
    console.log('Password:', password);
    console.log('Correct hash:', correctHash);
    console.log('Stored hash: 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
    
    // Test the verification
    const testResult = verifyPassword(password, correctHash);
    console.log('Verification test:', testResult ? '✅ PASS' : '❌ FAIL');
    
    // Update all users with the correct hash
    const result = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email IN ($2, $3, $4, $5)`,
      [
        correctHash,
        'john.doe@company.com',
        'jane.smith@company.com', 
        'emily.clark@company.com',
        'tom.brown@company.com'
      ]
    );
    
    console.log(`Updated ${result.rowCount} users`);
    
    // Verify the update
    const users = await pool.query('SELECT email, password_hash FROM users');
    console.log('\nUpdated users:');
    users.rows.forEach(user => {
      console.log(`${user.email}: ${user.password_hash}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixPasswords();
