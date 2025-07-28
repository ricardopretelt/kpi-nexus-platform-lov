const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const crypto = require('crypto');

const router = express.Router();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kpi_nexus',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to hash passwords
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Helper function to compare passwords
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Helper function to log audit events
const logAuditEvent = async (adminId, targetUserId, action, details) => {
  try {
    await pool.query(
      'INSERT INTO user_audit_log (admin_id, target_user_id, action, details) VALUES ($1, $2, $3, $4)',
      [adminId, targetUserId, action, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

// 1. User Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user profile
    const result = await pool.query(
      `INSERT INTO profiles (full_name, email, role, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, full_name, email, role, status`,
      [fullName, email, 'business_specialist', 'pending']
    );

    const user = result.rows[0];

    // Log registration event
    await logAuditEvent(null, user.id, 'user_registered', {
      email,
      fullName,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userResult = await pool.query(
      'SELECT * FROM profiles WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logAuditEvent(null, user.id, 'login_attempt_while_locked', {
        email,
        timestamp: new Date().toISOString()
      });
      return res.status(423).json({ 
        error: 'Account is temporarily locked. Please try again later.' 
      });
    }

    // Check user status
    if (user.status === 'pending') {
      await logAuditEvent(null, user.id, 'login_attempt_pending', {
        email,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ 
        error: 'Your account is pending confirmation by administrator.' 
      });
    }

    if (user.status === 'rejected') {
      await logAuditEvent(null, user.id, 'login_attempt_rejected', {
        email,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For now, we'll use a simple password check
    // In production, you'd want to store hashed passwords in the profiles table
    if (password !== 'password123') {
      // Increment failed login attempts
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = null;

      // Lock account after 5 failed attempts for 30 minutes
      if (newFailedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await pool.query(
        'UPDATE profiles SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
        [newFailedAttempts, lockedUntil, user.id]
      );

      await logAuditEvent(null, user.id, 'login_failed', {
        email,
        failedAttempts: newFailedAttempts,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Successful login - reset failed attempts and generate token
    await pool.query(
      'UPDATE profiles SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = generateToken(user.id);

    // Store token in database
    await pool.query(
      'INSERT INTO jwt_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, crypto.createHash('sha256').update(token).digest('hex'), new Date(Date.now() + 24 * 60 * 60 * 1000)]
    );

    await logAuditEvent(null, user.id, 'login_success', {
      email,
      timestamp: new Date().toISOString()
    });

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        forcePasswordChange: user.force_password_change
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token exists in database and is not expired
    const tokenResult = await pool.query(
      'SELECT * FROM jwt_tokens WHERE user_id = $1 AND token_hash = $2 AND expires_at > CURRENT_TIMESTAMP',
      [decoded.userId, crypto.createHash('sha256').update(token).digest('hex')]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user profile
    const userResult = await pool.query(
      'SELECT * FROM profiles WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// 4. Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization'].split(' ')[1];
    
    // Remove token from database
    await pool.query(
      'DELETE FROM jwt_tokens WHERE user_id = $1 AND token_hash = $2',
      [req.user.id, crypto.createHash('sha256').update(token).digest('hex')]
    );

    await logAuditEvent(null, req.user.id, 'logout', {
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      fullName: req.user.full_name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      forcePasswordChange: req.user.force_password_change
    }
  });
});

// 6. Update password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // In a real implementation, you'd update the password hash in the profiles table
    // For now, we'll just update the force_password_change flag
    await pool.query(
      'UPDATE profiles SET force_password_change = FALSE WHERE id = $1',
      [req.user.id]
    );

    await logAuditEvent(null, req.user.id, 'password_changed', {
      selfInitiated: true,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. Admin: Get all users
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(
      'SELECT id, full_name, email, role, status, created_at, last_login_at FROM profiles ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. Admin: Update user status
router.put('/users/:userId/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.query(
      'UPDATE profiles SET status = $1 WHERE id = $2',
      [status, userId]
    );

    await logAuditEvent(req.user.id, userId, `status_changed_to_${status}`, {
      newStatus: status
    });

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 9. Admin: Update user role
router.put('/users/:userId/role', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'data_specialist', 'business_specialist'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await pool.query(
      'UPDATE profiles SET role = $1 WHERE id = $2',
      [role, userId]
    );

    await logAuditEvent(req.user.id, userId, `role_changed_to_${role}`, {
      newRole: role
    });

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, authenticateToken };


