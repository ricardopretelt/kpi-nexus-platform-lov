const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'kpi_nexus',
  password: 'password',
  port: 5432,
});

async function debugLogin() {
  try {
    const email = 'john.doe@company.com';
    const password = 'password123';
    
    console.log('=== DEBUG LOGIN ===');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:', user.email);
    console.log('Stored hash:', user.password_hash);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password verification:', isValid ? '✅ PASS' : '❌ FAIL');
    
    // Generate a new hash for comparison
    const newHash = await bcrypt.hash(password, 12);
    console.log('New hash for same password:', newHash);
    
    // Test the new hash
    const isNewValid = await bcrypt.compare(password, newHash);
    console.log('New hash verification:', isNewValid ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugLogin();
