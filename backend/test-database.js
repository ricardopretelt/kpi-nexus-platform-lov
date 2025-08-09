const { Pool } = require('pg');
const { hashPassword, verifyPassword } = require('./consistent-hash');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'kpi_nexus',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function testDatabase() {
  try {
    console.log('=== PRODUCTION DATABASE TEST ===\n');
    
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('   ✅ Database connected at:', connectionTest.rows[0].now);
    
    // 2. Check if users table exists
    console.log('\n2. Checking users table...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    console.log('   Users table exists:', tableExists.rows[0].exists ? '✅ YES' : '❌ NO');
    
    if (!tableExists.rows[0].exists) {
      console.log('   ❌ FATAL: Users table does not exist!');
      return;
    }
    
    // 3. Check table structure
    console.log('\n3. Checking table structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('   Table columns:');
    columns.rows.forEach(col => {
      console.log(`     ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    const hasIsAdmin = columns.rows.some(col => col.column_name === 'is_admin');
    console.log('   is_admin column exists:', hasIsAdmin ? '✅ YES' : '❌ NO');
    
    // 4. Check all users in database
    console.log('\n4. Checking users in database...');
    const users = await pool.query('SELECT * FROM users ORDER BY id');
    console.log('   Total users found:', users.rows.length);
    
    if (users.rows.length === 0) {
      console.log('   ❌ NO USERS FOUND! Database might not be initialized.');
      return;
    }
    
    users.rows.forEach((user, index) => {
      console.log(`\n   User ${index + 1}:`);
      console.log(`     ID: ${user.id}`);
      console.log(`     Username: ${user.username}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Full Name: ${user.full_name}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     is_admin: ${user.is_admin} (type: ${typeof user.is_admin})`);
      console.log(`     Password Hash: ${user.password_hash}`);
      console.log(`     Created: ${user.created_at}`);
    });
    
    // 5. Test login for john.doe specifically
    console.log('\n5. Testing login for john.doe@company.com...');
    const testUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['john.doe@company.com']
    );
    
    if (testUser.rows.length === 0) {
      console.log('   ❌ john.doe@company.com NOT FOUND in database');
    } else {
      const user = testUser.rows[0];
      console.log('   ✅ User found:');
      console.log(`     Email: ${user.email}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     is_admin: ${user.is_admin}`);
      console.log(`     Stored hash: ${user.password_hash}`);
      
      // Test password
      const expectedHash = hashPassword('password123');
      console.log(`     Expected hash: ${expectedHash}`);
      console.log(`     Hash matches: ${user.password_hash === expectedHash ? '✅ YES' : '❌ NO'}`);
      
      const passwordValid = verifyPassword('password123', user.password_hash);
      console.log(`     Password valid: ${passwordValid ? '✅ YES' : '❌ NO'}`);
      
      if (passwordValid) {
        console.log('   🎉 LOGIN SHOULD WORK!');
      } else {
        console.log('   ❌ LOGIN WILL FAIL - Password verification failed');
      }
    }
    
    // 6. Test the exact SQL query the backend uses
    console.log('\n6. Testing backend login query...');
    const backendQuery = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role, is_admin FROM users WHERE email = $1',
      ['john.doe@company.com']
    );
    
    if (backendQuery.rows.length === 0) {
      console.log('   ❌ Backend query returns no results');
    } else {
      console.log('   ✅ Backend query successful');
      const user = backendQuery.rows[0];
      console.log('   Query result:', JSON.stringify(user, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();