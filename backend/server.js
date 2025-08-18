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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Added PATCH method
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
  
  // Add specific debugging for admin toggle endpoint
  if (req.path.includes('/api/users/') && req.path.includes('/admin')) {
    console.log('=== ADMIN TOGGLE REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
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
    const { username, email, password, fullName, role = 'user', force_password_change = false } = req.body;
    // Validate input
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists - Enhanced email uniqueness check
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      // Check specifically for email duplication
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already taken' });
      }
      
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password using consistent hash
    const hashedPassword = hashPassword(password);

    // Insert new user
    // Insert new user with force_password_change flag
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, force_password_change)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, full_name, role, force_password_change`,
      [username, email, hashedPassword, fullName, role, force_password_change]
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
        role: user.role,
        force_password_change: user.force_password_change
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

    // Find user by email - Include is_active field
    const result = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role, is_admin, is_active, force_password_change FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('Found user:', user);
    console.log('✅ User found:', user.email);
    console.log('Stored hash:', user.password_hash);

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ User account is inactive');
      return res.status(401).json({ error: 'Account is inactive. Please contact administrator.' });
    }

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
        is_admin: user.is_admin,
        is_active: user.is_active,
        force_password_change: user.force_password_change
      },
      token
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add email uniqueness check endpoint
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    const available = result.rows.length === 0;
    
    res.json({ 
      available,
      message: available ? 'Email is available' : 'Email already taken'
    });
  } catch (err) {
    console.error('Email check error:', err);
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


// Password change endpoint
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const hashedPassword = hashPassword(newPassword);
    await pool.query(
      'UPDATE users SET password_hash = $1, force_password_change = FALSE WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully', success: true });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET Routes (existing) - now protected with authentication
app.get('/api/kpis', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        k.id,
        k.name,
        kv.definition,
        kv.sql_query as "sqlQuery",
        kv.topics,
        u1.full_name as "dataSpecialist",
        u2.full_name as "businessSpecialist",
        kv.created_at as "lastUpdated",
        kv.status,
        kv.additional_blocks as "additionalBlocks",
        json_agg(
          json_build_object(
            'id', kv2.id,
            'version', kv2.version_number,
            'definition', kv2.definition,
            'sqlQuery', kv2.sql_query,
            'updatedAt', kv2.created_at,
            'changes', kv2.change_description,
            'dataSpecialist', u4.full_name,
            'businessSpecialist', u5.full_name
          ) ORDER BY kv2.version_number
        ) as versions
      FROM kpis k
      INNER JOIN kpi_versions kv ON k.active_version = kv.id
      LEFT JOIN users u1 ON kv.data_specialist_id = u1.id
      LEFT JOIN users u2 ON kv.business_specialist_id = u2.id
      LEFT JOIN kpi_versions kv2 ON k.id = kv2.kpi_id
      LEFT JOIN users u4 ON kv2.data_specialist_id = u4.id
      LEFT JOIN users u5 ON kv2.business_specialist_id = u5.id
      GROUP BY k.id, k.name, kv.definition, kv.sql_query, kv.topics, kv.status, kv.additional_blocks, kv.created_at, u1.full_name, u2.full_name
      ORDER BY k.id
    `);
    
    // Transform the data - return topic IDs directly
    const transformedKPIs = result.rows.map(kpi => {
      return {
        ...kpi,
        // Return topic IDs directly (no conversion needed)
        topics: Array.isArray(kpi.topics) ? kpi.topics : [],
        // Ensure additionalBlocks is always an array or undefined
        additionalBlocks: kpi.additionalBlocks || undefined,
        // Ensure versions is always an array
        versions: Array.isArray(kpi.versions) ? kpi.versions : []
      };
    });
    
    res.json(transformedKPIs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new endpoint to get a single KPI by ID
app.get('/api/kpis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        k.id,
        k.name,
        kv.definition,
        kv.sql_query as "sqlQuery",
        kv.topics,
        u1.full_name as "dataSpecialist",
        u2.full_name as "businessSpecialist",
        kv.created_at as "lastUpdated",
        kv.status,
        kv.additional_blocks as "additionalBlocks",
        json_agg(
          json_build_object(
            'id', kv2.id,
            'version', kv2.version_number,
            'definition', kv2.definition,
            'sqlQuery', kv2.sql_query,
            'updatedAt', kv2.created_at,
            'changes', kv2.change_description,
            'dataSpecialist', u4.full_name,
            'businessSpecialist', u5.full_name
          ) ORDER BY kv2.version_number
        ) as versions
      FROM kpis k
      INNER JOIN kpi_versions kv ON k.active_version = kv.id
      LEFT JOIN users u1 ON kv.data_specialist_id = u1.id
      LEFT JOIN users u2 ON kv.business_specialist_id = u2.id
      LEFT JOIN kpi_versions kv2 ON k.id = kv2.kpi_id
      LEFT JOIN users u4 ON kv2.data_specialist_id = u4.id
      LEFT JOIN users u5 ON kv2.business_specialist_id = u5.id
      WHERE k.id = $1
      GROUP BY k.id, k.name, kv.definition, kv.sql_query, kv.topics, kv.status, kv.additional_blocks, kv.created_at, u1.full_name, u2.full_name
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    const kpi = result.rows[0];
    
    // Transform the data to ensure proper structure and backward compatibility
    const transformedKPI = {
      ...kpi,
      // Ensure topics is always an array
      topics: Array.isArray(kpi.topics) ? kpi.topics : (kpi.topics ? [kpi.topics] : []),
      // Add backward compatibility for topic (singular) - use first topic
      topic: Array.isArray(kpi.topics) && kpi.topics.length > 0 ? kpi.topics[0] : '',
      // Ensure additionalBlocks is always an array or undefined
      additionalBlocks: kpi.additionalBlocks || undefined,
      // Ensure versions is always an array
      versions: Array.isArray(kpi.versions) ? kpi.versions : []
    };
    
    res.json(transformedKPI);
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
      'SELECT id, username, email, full_name, role, is_admin, is_active FROM users ORDER BY full_name'
    );
    
    // Transform the data to ensure proper boolean conversion
    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_admin: user.is_admin === true || user.is_admin === 't', // Convert PostgreSQL boolean to JavaScript boolean
      is_active: user.is_active === true || user.is_active === 't' // Add this line
    }));
    
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new PATCH endpoint for updating user admin status
app.patch('/api/users/:id/admin', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_admin } = req.body;
    
    console.log(`Updating user ${id} admin status to:`, is_admin);
    
    // Validate input
    if (typeof is_admin !== 'boolean') {
      return res.status(400).json({ error: 'is_admin must be a boolean value' });
    }
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id, is_admin FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`User ${id} current admin status:`, userCheck.rows[0].is_admin);
    
    // Update the user's admin status
    await pool.query('UPDATE users SET is_admin = $1 WHERE id = $2', [is_admin, id]);
    
    console.log(`Successfully updated user ${id} admin status to:`, is_admin);
    
    // Return the updated user data
    const updatedUser = await pool.query(
      'SELECT id, username, email, full_name, role, is_admin FROM users WHERE id = $1',
      [id]
    );
    
    // Transform the data to ensure proper boolean conversion
    const user = updatedUser.rows[0];
    const transformedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_admin: user.is_admin === true || user.is_admin === 't'
    };
    
    res.json(transformedUser);
  } catch (err) {
    console.error('Error updating user admin status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST Routes (existing) - now protected with authentication
app.post('/api/kpis', authenticateToken, async (req, res) => {
  try {
    const { name, definition, sqlQuery, topics, dataSpecialist, businessSpecialist, status, additionalBlocks, changeDescription } = req.body;
    
    // Validate required fields
    if (!name || !definition || !sqlQuery || !topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: 'Name, definition, SQL query, and at least one topic are required' });
    }
    
    // Require at least one specialist
    if (!dataSpecialist && !businessSpecialist) {
      return res.status(400).json({ error: 'At least one specialist (data or business) is required' });
    }
    
    let dataSpecialistId = null;
    let businessSpecialistId = null;
    
    // Get user IDs from names if provided
    if (dataSpecialist) {
      const dataSpecialistResult = await pool.query('SELECT id FROM users WHERE full_name = $1', [dataSpecialist]);
      if (dataSpecialistResult.rows.length === 0) {
        return res.status(400).json({ error: `Data specialist '${dataSpecialist}' not found` });
      }
      dataSpecialistId = dataSpecialistResult.rows[0].id;
    }
    
    if (businessSpecialist) {
      const businessSpecialistResult = await pool.query('SELECT id FROM users WHERE full_name = $1', [businessSpecialist]);
      if (businessSpecialistResult.rows.length === 0) {
        return res.status(400).json({ error: `Business specialist '${businessSpecialist}' not found` });
      }
      businessSpecialistId = businessSpecialistResult.rows[0].id;
    }
    
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First create the KPI record
      const kpiResult = await client.query(`
        INSERT INTO kpis (name, created_at, updated_at)
        VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `, [name]);
      
      const kpiId = kpiResult.rows[0].id;
      
      // Then create the initial KPI version
      const versionResult = await client.query(`
        INSERT INTO kpi_versions (kpi_id, version_number, definition, sql_query, topics, data_specialist_id, business_specialist_id, status, additional_blocks, updated_by, change_description)
        VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [kpiId, definition, sqlQuery, JSON.stringify(topics), dataSpecialistId, businessSpecialistId, status || 'active', additionalBlocks ? JSON.stringify(additionalBlocks) : null, req.user.id, changeDescription || 'Initial version created']);
      
      // Update the KPI to reference the active version
      await client.query(`
        UPDATE kpis SET active_version = $1 WHERE id = $2
      `, [versionResult.rows[0].id, kpiId]);
      
      await client.query('COMMIT');
      
      res.status(201).json({ id: kpiId, message: 'KPI created successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
    const { name, definition, sqlQuery, topics, dataSpecialist, businessSpecialist, status, additionalBlocks, changeDescription } = req.body;
    
    // Validate required fields
    if (!name || !definition || !sqlQuery || !topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: 'Name, definition, SQL query, and at least one topic are required' });
    }
    
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
    
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update KPI name
      await client.query(`
        UPDATE kpis 
        SET name = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [name, id]);
      
      // Create new version
      const versionResult = await client.query('SELECT MAX(version_number) as max_version FROM kpi_versions WHERE kpi_id = $1', [id]);
      const newVersion = (versionResult.rows[0].max_version || 0) + 1;
      
      const newVersionResult = await client.query(`
        INSERT INTO kpi_versions (kpi_id, version_number, definition, sql_query, topics, data_specialist_id, business_specialist_id, status, additional_blocks, updated_by, change_description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [id, newVersion, definition, sqlQuery, JSON.stringify(topics), dataSpecialistId, businessSpecialistId, status, additionalBlocks ? JSON.stringify(additionalBlocks) : null, req.user.id, changeDescription || 'Updated via API']);
      
      // Update the KPI to reference the new active version
      await client.query(`
        UPDATE kpis SET active_version = $1 WHERE id = $2
      `, [newVersionResult.rows[0].id, id]);
      
      await client.query('COMMIT');
      
      res.json({ message: 'KPI updated successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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

// Add user update endpoint
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, is_active } = req.body;
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness - skip if email unchanged
    const currentUser = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
    if (currentUser.rows.length > 0 && currentUser.rows[0].email !== email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }

    // Update user
    await pool.query(
      'UPDATE users SET full_name = $1, email = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [full_name, email, is_active, id]
    );

    // No need to update KPIs - they reference users by ID, not by name
    // The KPI fetch endpoint already JOINs the users table to get current names
    // When KPIs are fetched, they will automatically show the updated names

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add email availability check endpoint (optional)
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email, excludeUserId } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    let query = 'SELECT id FROM users WHERE email = $1';
    let params = [email];
    
    if (excludeUserId) {
      query += ' AND id != $2';
      params.push(excludeUserId);
    }
    
    const result = await pool.query(query, params);
    
    res.json({ 
      available: result.rows.length === 0,
      email: email
    });
  } catch (err) {
    console.error('Email check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('🔧 Backend server started with latest changes'); // Add this line
});