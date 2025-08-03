const bcrypt = require('bcrypt');

async function debugBcrypt() {
  console.log('=== BCRYPT DEBUG ===');
  
  const password = 'password123';
  const storedHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2';
  
  console.log('Password:', password);
  console.log('Stored hash:', storedHash);
  
  try {
    // Test the stored hash
    const isValid = await bcrypt.compare(password, storedHash);
    console.log('Stored hash verification:', isValid ? '✅ PASS' : '❌ FAIL');
    
    // Generate a new hash
    const newHash = await bcrypt.hash(password, 12);
    console.log('New hash:', newHash);
    
    // Test the new hash
    const isNewValid = await bcrypt.compare(password, newHash);
    console.log('New hash verification:', isNewValid ? '✅ PASS' : '❌ FAIL');
    
    // Test with a known working hash
    const workingHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2';
    const isWorkingValid = await bcrypt.compare(password, workingHash);
    console.log('Working hash verification:', isWorkingValid ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugBcrypt();
