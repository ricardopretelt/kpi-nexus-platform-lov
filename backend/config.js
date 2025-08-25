const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
  },
  
  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
  },
  
  // Server
  server: {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // File uploads
  uploads: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  
  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
      ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173', 'http://frontend:8080'],
  },
  
  // External services
  external: {
    analyticsApiKey: process.env.ANALYTICS_API_KEY,
    emailServiceKey: process.env.EMAIL_SERVICE_KEY,
  }
};

// Debug: Let's see what's actually loaded
console.log('🔍 Environment variables check:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

// Validation with fallbacks
const requiredFields = [
  'database.url',
  'database.host', 
  'database.user',
  'database.password',
  'database.name',
  'auth.jwtSecret'
];

let missingFields = [];
requiredFields.forEach(field => {
  const value = field.split('.').reduce((obj, key) => obj?.[key], config);
  if (!value) {
    missingFields.push(field);
  }
});

if (missingFields.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingFields.join(', '));
  console.warn('💡 Using fallback values for development');
  console.warn(' Create a .env file for production use');
} else {
  console.log('✅ All environment variables loaded successfully');
}

console.log('✅ Configuration loaded successfully');
console.log(' Database:', config.database.name, 'on', config.database.host);
console.log('🚀 Server port:', config.server.port);

module.exports = config;
