const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { getStudentRecordByUserId } = require('../utils/student');

// Get all users
router.get('/', authMiddleware, requireRole('superadmin', 'warden'), async (req, res) => {
  try {
    let query = 'SELECT id, full_name, full_name AS name, email, role, last_login, created_at FROM users WHERE 1=1';
    const params = [];

    if (req.query.role) {
      query += ' AND role = ?';
      params.push(req.query.role);
    }

    const users = await db.all(query, params);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, full_name, full_name AS name, email, role, last_login, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create user (admin only)
router.post('/', authMiddleware, requireRole('superadmin', 'warden'), async (req, res) => {
  try {
    const name = req.body.full_name || req.body.name;
    const { email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required' });
    }

    if (!['student', 'caretaker', 'accountant', 'warden', 'superadmin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if email exists
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    if (role === 'student') {
      await db.run(
        `INSERT INTO students (user_id, roll_number, program, year, phone)
         VALUES (?, ?, ?, ?, ?)`,
        [
          result.id,
          req.body.roll_number || `STU${String(result.id).padStart(4, '0')}`,
          req.body.program || 'Undeclared',
          Number(req.body.year) || 1,
          req.body.phone || null
        ]
      );
    }

    const user = await db.get(
      'SELECT id, full_name, full_name AS name, email, role, last_login, created_at FROM users WHERE id = ?',
      [result.id]
    );

    const student = role === 'student' ? await getStudentRecordByUserId(result.id) : null;
    if (student) {
      user.student_id = student.id;
    }

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
router.put('/:id', authMiddleware, requireRole('superadmin', 'warden'), async (req, res) => {
  try {
    const updates = [];
    const values = [];

    if (req.body.full_name || req.body.name) {
      updates.push('full_name = ?');
      values.push(req.body.full_name || req.body.name);
    }
    if (req.body.email) {
      updates.push('email = ?');
      values.push(req.body.email);
    }
    if (req.body.role) {
      updates.push('role = ?');
      values.push(req.body.role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(req.params.id);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const user = await db.get(
      'SELECT id, full_name, full_name AS name, email, role, last_login, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
