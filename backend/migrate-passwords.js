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

async function migratePasswords() {
  try {
    console.log('Starting password migration...');
    
    // Get all users
    const users = await pool.query('SELECT id, username FROM users');
    
    // Hash the default password 'password123' for all users
    const defaultPassword = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    
    // Update all users with the hashed password
    for (const user of users.rows) {
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, user.id]
      );
      console.log(`Updated password for user: ${user.username}`);
    }
    
    console.log('Password migration completed successfully!');
    console.log('All users now have the hashed password for: password123');
    
  } catch (error) {
    console.error('Error during password migration:', error);
  } finally {
    await pool.end();
  }
}

migratePasswords();
