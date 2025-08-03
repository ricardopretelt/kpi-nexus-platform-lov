const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'kpi_nexus',
  password: 'password',
  port: 5432,
});

async function updatePasswords() {
  try {
    console.log('Generating proper bcrypt hash for password123...');
    
    const password = 'password123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Generated hash:', hashedPassword);
    
    // Update all users with the new hash
    const result = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email IN ($2, $3, $4, $5)`,
      [
        hashedPassword,
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
      console.log(`${user.email}: ${user.password_hash.substring(0, 30)}...`);
    });
    
    // Test the hash
    const testResult = await bcrypt.compare(password, hashedPassword);
    console.log('\nHash verification test:', testResult ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords(); 