const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'password123';
  const saltRounds = 12;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Generated Hash:', hash);
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash verification:', isValid);
    
    console.log('\nSQL to update database:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email IN ('john.doe@company.com', 'jane.smith@company.com', 'emily.clark@company.com', 'tom.brown@company.com');`);
    
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();
