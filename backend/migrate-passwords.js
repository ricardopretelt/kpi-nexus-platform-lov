const { Pool } = require('pg');
const { hashPassword } = require('./consistent-hash');

const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'kpi_nexus',
  password: 'password',
  port: 5432,
});

async function migratePasswords() {
  try {
    console.log('=== MIGRATING PASSWORDS ===');
    
    // Get all users
    const result = await pool.query('SELECT id, email, password_hash FROM users');
    
    console.log(`Found ${result.rows.length} users`);
    
    for (const user of result.rows) {
      console.log(`Processing user: ${user.email}`);
      
      // For existing users, we'll set a default password
      // In production, you'd want to handle this differently
      const defaultPassword = 'password123';
      const newHash = hashPassword(defaultPassword);
      
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newHash, user.id]
      );
      
      console.log(`✅ Updated password for ${user.email}`);
    }
    
    console.log('✅ Migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
  }
}

migratePasswords();
