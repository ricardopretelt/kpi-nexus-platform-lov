const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { hashPassword, verifyPassword } = require('./consistent-hash');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000', 
    'http://localhost:5173',
    'http://frontend:8080',
    'http://18.217.206.5:8080',
    'http://18.217.206.5:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Enhanced debugging middleware
app.use((req, res, next) => {
  console.log(`=== REQUEST ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Origin: ${req.headers.origin}`);
  
  if (req.path === '/api/auth/login') {
    console.log('=== LOGIN REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
  }
  next();
});

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kpi_nexus',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, fullName, role = 'user' } = req.body;

    // Validate input
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password using consistent hash
    const hashedPassword = hashPassword(password);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role`,
      [username, email, hashedPassword, fullName, role]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role, is_admin FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('Found user:', user); // Add this debug log
    console.log('✅ User found:', user.email);
    console.log('Stored hash:', user.password_hash);

    // Verify password using consistent hash
    const isValidPassword = verifyPassword(password, user.password_hash);
    console.log('Password verification result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Password verification failed');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Password verified successfully');

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ JWT token generated');

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        is_admin: user.is_admin // Change from isAdmin to is_admin
      },
      token
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just return a success message
  res.json({ message: 'Logout successful' });
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, is_admin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        is_admin: user.is_admin // Change from isAdmin to is_admin
      }
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Password change endpoint
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Get current user with password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = verifyPassword(currentPassword, userResult.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newHashedPassword = hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHashedPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this endpoint for user invites
app.post('/api/users/invite', authenticateToken, async (req, res) => {
  try {
    const { email, name: fullName, role } = req.body;
    const username = email.split('@')[0];
    const password = req.body.password; // Generated password from frontend

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Insert new user with force_password_change flag
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, force_password_change)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, username, email, full_name, role`,
      [username, email, hashedPassword, fullName, role]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Invite user error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET Routes (existing) - now protected with authentication
app.get('/api/kpis', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        k.id,
        k.name,
        k.definition,
        k.sql_query as "sqlQuery",
        t.name as topic,
        u1.full_name as "dataSpecialist",
        u2.full_name as "businessSpecialist",
        k.dashboard_preview as "dashboardPreview",
        k.updated_at as "lastUpdated",
        k.status,
        json_agg(
          json_build_object(
            'id', kv.id,
            'version', kv.version_number,
            'definition', kv.definition,
            'sqlQuery', kv.sql_query,
            'updatedBy', u3.full_name,
            'updatedAt', kv.created_at,
            'changes', kv.changes
          ) ORDER BY kv.version_number
        ) as versions
      FROM kpis k
      LEFT JOIN topics t ON k.topic_id = t.id
      LEFT JOIN users u1 ON k.data_specialist_id = u1.id
      LEFT JOIN users u2 ON k.business_specialist_id = u2.id
      LEFT JOIN kpi_versions kv ON k.id = kv.kpi_id
      LEFT JOIN users u3 ON kv.updated_by = u3.id
      GROUP BY k.id, t.name, u1.full_name, u2.full_name
      ORDER BY k.id
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/topics', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM topics ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, is_admin FROM users ORDER BY full_name'
    );
    
    // Transform the data to ensure proper boolean conversion
    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_admin: user.is_admin === true || user.is_admin === 't' // Convert PostgreSQL boolean to JavaScript boolean
    }));
    
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST Routes (existing) - now protected with authentication
app.post('/api/kpis', authenticateToken, async (req, res) => {
  try {
    const { name, definition, sqlQuery, topic, dataSpecialist, businessSpecialist, dashboardPreview, status } = req.body;
    
    // Get topic_id from topic name
    const topicResult = await pool.query('SELECT id FROM topics WHERE name = $1', [topic]);
    if (topicResult.rows.length === 0) {
      return res.status(400).json({ error: 'Topic not found' });
    }
    const topicId = topicResult.rows[0].id;
    
    // Get user IDs from names
    const dataSpecialistResult = await pool.query('SELECT id FROM users WHERE full_name = $1', [dataSpecialist]);
    const businessSpecialistResult = await pool.query('SELECT id FROM users WHERE full_name = $1', [businessSpecialist]);
    
    if (dataSpecialistResult.rows.length === 0) {
      return res.status(400).json({ error: `Data specialist '${dataSpecialist}' not found` });
    }
    if (businessSpecialistResult.rows.length === 0) {
      return res.status(400).json({ error: `Business specialist '${businessSpecialist}' not found` });
    }

    const dataSpecialistId = dataSpecialistResult.rows[0].id;
    const businessSpecialistId = businessSpecialistResult.rows[0].id;
    
    const result = await pool.query(`
      INSERT INTO kpis (name, definition, sql_query, topic_id, data_specialist_id, business_specialist_id, dashboard_preview, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [name, definition, sqlQuery, topicId, dataSpecialistId, businessSpecialistId, dashboardPreview, status || 'active']);
    
    // Create initial version
    await pool.query(`
      INSERT INTO kpi_versions (kpi_id, version_number, definition, sql_query, updated_by, changes)
      VALUES ($1, 1, $2, $3, $4, 'Initial version created')
    `, [result.rows[0].id, definition, sqlQuery, req.user.id]);
    
    res.status(201).json({ id: result.rows[0].id, message: 'KPI created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/topics', authenticateToken, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    
    const result = await pool.query(`
      INSERT INTO topics (name, description, icon, color)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description, icon, color]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT Routes (existing) - now protected with authentication
app.put('/api/kpis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, definition, sqlQuery, topic, dataSpecialist, businessSpecialist, dashboardPreview, status } = req.body;
    
    // Get topic_id from topic name
    const topicResult = await pool.query('SELECT id FROM topics WHERE name = $1', [topic]);
    if (topicResult.rows.length === 0) {
      return res.status(400).json({ error: 'Topic not found' });
    }
    const topicId = topicResult.rows[0].id;
    
    // Get user IDs from names
    const dataSpecialistResult = await pool.query('SELECT id FROM users WHERE full_name = $1', [dataSpecialist]);
    const businessSpecialistResult = await pool.query('SELECT id FROM users WHERE full_name = $1', [businessSpecialist]);
    
    if (dataSpecialistResult.rows.length === 0) {
      return res.status(400).json({ error: `Data specialist '${dataSpecialist}' not found` });
    }
    if (businessSpecialistResult.rows.length === 0) {
      return res.status(400).json({ error: `Business specialist '${businessSpecialist}' not found` });
    }

    const dataSpecialistId = dataSpecialistResult.rows[0].id;
    const businessSpecialistId = businessSpecialistResult.rows[0].id;
    
    await pool.query(`
      UPDATE kpis 
      SET name = $1, definition = $2, sql_query = $3, topic_id = $4, 
          data_specialist_id = $5, business_specialist_id = $6, 
          dashboard_preview = $7, status = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
    `, [name, definition, sqlQuery, topicId, dataSpecialistId, businessSpecialistId, dashboardPreview, status, id]);
    
    // Create new version
    const versionResult = await pool.query('SELECT MAX(version_number) as max_version FROM kpi_versions WHERE kpi_id = $1', [id]);
    const newVersion = (versionResult.rows[0].max_version || 0) + 1;
    
    await pool.query(`
      INSERT INTO kpi_versions (kpi_id, version_number, definition, sql_query, updated_by, changes)
      VALUES ($1, $2, $3, $4, $5, 'Updated via API')
    `, [id, newVersion, definition, sqlQuery, req.user.id]);
    
    res.json({ message: 'KPI updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE Routes (existing) - now protected with authentication
app.delete('/api/kpis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM kpis WHERE id = $1', [id]);
    
    res.json({ message: 'KPI deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('🔧 Backend server started with latest changes'); // Add this line
});