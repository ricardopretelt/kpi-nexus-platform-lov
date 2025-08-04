const { Pool } = require('pg');
const { hashPassword, verifyPassword } = require('./consistent-hash');

const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'kpi_nexus',
  password: 'password',
  port: 5432,
});

async function testLoginWithNewHash() {
  try {
    console.log('=== TESTING LOGIN WITH NEW HASH SYSTEM ===');
    
    // Test 1: Check if consistent hash is working
    console.log('\n1. Testing consistent hash functionality:');
    const password = 'password123';
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);
    console.log('Password:', password);
    console.log('Hash 1:', hash1);
    console.log('Hash 2:', hash2);
    console.log('Hashes are identical:', hash1 === hash2 ? '✅ YES' : '❌ NO');
    console.log('Verification test:', verifyPassword(password, hash1) ? '✅ PASS' : '❌ FAIL');
    
    // Test 2: Check existing users
    console.log('\n2. Checking existing users:');
    const usersResult = await pool.query('SELECT id, email, username, password_hash FROM users');
    console.log('Total users found:', usersResult.rows.length);
    usersResult.rows.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user.id,
        email: user.email,
        username: user.username,
        hashLength: user.password_hash ? user.password_hash.length : 0
      });
    });
    
    // Test 3: Test login for specific user
    console.log('\n3. Testing login for john.doe@company.com:');
    const email = 'john.doe@company.com';
    const loginPassword = 'password123';
    
    const loginResult = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role FROM users WHERE email = $1',
      [email]
    );
    
    if (loginResult.rows.length === 0) {
      console.log('❌ User not found, creating test user...');
      
      // Create test user
      const newHash = hashPassword(loginPassword);
      const createResult = await pool.query(
        'INSERT INTO users (username, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['johndoe', email, newHash, 'John Doe', 'user']
      );
      
      console.log('✅ Test user created with ID:', createResult.rows[0].id);
      console.log('Email:', email);
      console.log('Password:', loginPassword);
      console.log('New hash:', newHash);
      
      // Test the newly created user
      const testResult = await pool.query(
        'SELECT id, username, email, password_hash, full_name, role FROM users WHERE email = $1',
        [email]
      );
      
      const testUser = testResult.rows[0];
      const isValid = verifyPassword(loginPassword, testUser.password_hash);
      console.log('Login test for new user:', isValid ? '✅ PASS' : '❌ FAIL');
      
    } else {
      const user = loginResult.rows[0];
      console.log('✅ User found:', user.email);
      console.log('Stored hash:', user.password_hash);
      
      // Test with current hash
      const isValidCurrent = verifyPassword(loginPassword, user.password_hash);
      console.log('Login test with current hash:', isValidCurrent ? '✅ PASS' : '❌ FAIL');
      
      // If current hash doesn't work, update it
      if (!isValidCurrent) {
        console.log('Updating password hash...');
        const newHash = hashPassword(loginPassword);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE email = $2',
          [newHash, email]
        );
        
        // Test again
        const updatedResult = await pool.query(
          'SELECT password_hash FROM users WHERE email = $1',
          [email]
        );
        const updatedUser = updatedResult.rows[0];
        const isValidUpdated = verifyPassword(loginPassword, updatedUser.password_hash);
        console.log('Login test with updated hash:', isValidUpdated ? '✅ PASS' : '❌ FAIL');
      }
    }
    
    // Test 4: Test API endpoint simulation
    console.log('\n4. Testing API endpoint simulation:');
    const testEmail = 'john.doe@company.com';
    const testPassword = 'password123';
    
    const apiResult = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role FROM users WHERE email = $1',
      [testEmail]
    );
    
    if (apiResult.rows.length > 0) {
      const apiUser = apiResult.rows[0];
      const apiValid = verifyPassword(testPassword, apiUser.password_hash);
      
      if (apiValid) {
        console.log('✅ API login would succeed');
        console.log('User data:', {
          id: apiUser.id,
          username: apiUser.username,
          email: apiUser.email,
          fullName: apiUser.full_name,
          role: apiUser.role
        });
      } else {
        console.log('❌ API login would fail - password verification failed');
      }
    } else {
      console.log('❌ API login would fail - user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    console.log('\n=== TEST COMPLETED ===');
  }
}

testLoginWithNewHash();
