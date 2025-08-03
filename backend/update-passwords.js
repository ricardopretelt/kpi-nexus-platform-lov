const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kpi_nexus',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function updatePasswords() {
  try {
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
    
    console.log('Updated', result.rowCount, 'users');
    
    // Test the hash
    const testResult = await bcrypt.compare(password, hashedPassword);
    console.log('Hash verification test:', testResult);
    
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords(); 