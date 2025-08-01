const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Import authentication routes
const { router: authRouter, authenticateToken } = require('./auth');

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kpi_nexus',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Authentication routes
app.use('/api/auth', authRouter);

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
    const result = await pool.query('SELECT id, username, email, full_name, role FROM users ORDER BY full_name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST Routes (new - for creating data) - now protected
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
    
    const dataSpecialistId = dataSpecialistResult.rows[0]?.id || 1;
    const businessSpecialistId = businessSpecialistResult.rows[0]?.id || 2;
    
    const result = await pool.query(`
      INSERT INTO kpis (name, definition, sql_query, topic_id, data_specialist_id, business_specialist_id, dashboard_preview, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [name, definition, sqlQuery, topicId, dataSpecialistId, businessSpecialistId, dashboardPreview, status || 'active']);
    
    // Create initial version
    await pool.query(`
      INSERT INTO kpi_versions (kpi_id, version_number, definition, sql_query, updated_by, changes)
      VALUES ($1, 1, $2, $3, $4, 'Initial version created')
    `, [result.rows[0].id, definition, sqlQuery, dataSpecialistId]);
    
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

// PUT Routes (new - for updating data) - now protected
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
    
    const dataSpecialistId = dataSpecialistResult.rows[0]?.id || 1;
    const businessSpecialistId = businessSpecialistResult.rows[0]?.id || 2;
    
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
    `, [id, newVersion, definition, sqlQuery, dataSpecialistId]);
    
    res.json({ message: 'KPI updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE Routes (new - for deleting data) - now protected
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
});