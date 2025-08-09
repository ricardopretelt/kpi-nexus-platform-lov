const { hashPassword, verifyPassword } = require('./consistent-hash');

function generateHash() {
  const password = 'password123';
  
  try {
    const hash = hashPassword(password);
    console.log('Password:', password);
    console.log('Generated Hash:', hash);
    
    // Verify the hash works
    const isValid = verifyPassword(password, hash);
    console.log('Hash verification:', isValid);
    
    console.log('\nSQL to update database:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email IN ('john.doe@company.com', 'jane.smith@company.com', 'emily.clark@company.com', 'tom.brown@company.com');`);
    
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();
