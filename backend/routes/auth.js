const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const config = require('../config/env');
const { authMiddleware } = require('../middleware/auth');
const { getStudentRecordByUserId } = require('../utils/student');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE }
  );
};

const buildUserPayload = async (user) => {
  const student = user.role === 'student'
    ? await getStudentRecordByUserId(user.id)
    : null;

  return {
    id: user.id,
    student_id: student ? student.id : null,
    email: user.email,
    full_name: user.full_name,
    role: user.role
  };
};

// Login
router.post('/login', [
  body('email').isEmail(),
  body('password').isLength({ min: 3 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [req.body.email]);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Last-login tracking should not block authentication if the DB is temporarily read-only.
    try {
      await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    } catch (writeError) {
      console.warn(`Warning: failed to update last_login for user ${user.id}: ${writeError.message}`);
    }

    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        token,
        user: await buildUserPayload(user)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['student', 'caretaker'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password, role } = req.body;
    const fullName = req.body.full_name || req.body.name;

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [email, hash, fullName, role]
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

    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.id]);
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: await buildUserPayload(user)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const payload = await buildUserPayload(user);
    res.json({
      success: true,
      data: {
        ...payload,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
