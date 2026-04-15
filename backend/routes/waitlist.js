const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const db = require('../config/database');
const { requireStudentRecord, resolveStudentRecord } = require('../utils/student');

// Get waitlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT * FROM waitlist WHERE 1=1';
    const params = [];

    if (req.user.role === 'student') {
      const student = await requireStudentRecord(null, req.user.id);
      query += ' AND student_id = ?';
      params.push(student.id);
    } else if (req.query.student_id) {
      const student = await resolveStudentRecord(req.query.student_id);
      if (!student) {
        return res.json({ success: true, data: [] });
      }
      query += ' AND student_id = ?';
      params.push(student.id);
    }

    if (req.query.preferred_block) {
      query += ' AND preferred_block = ?';
      params.push(req.query.preferred_block);
    }

    query += ' ORDER BY priority DESC, created_at ASC';
    const waitlist = await db.all(query, params);
    res.json({ success: true, data: waitlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add to waitlist
router.post('/', authMiddleware, async (req, res) => {
  try {
    const student = await requireStudentRecord(
      req.body.student_id,
      req.user.role === 'student' ? req.user.id : null
    );
    const preferredBlock = req.body.preferred_block || req.body.room_id || null;

    // Check if already in waitlist
    const existing = await db.get(
      'SELECT * FROM waitlist WHERE student_id = ? AND COALESCE(preferred_block, 0) = COALESCE(?, 0)',
      [student.id, preferredBlock]
    );

    if (existing) {
      return res.status(400).json({ success: false, message: 'Student is already on the waitlist for this block' });
    }

    const result = await db.run(
      `INSERT INTO waitlist (student_id, preferred_block, priority, created_at)
       VALUES (?, ?, ?, ?)`,
      [student.id, preferredBlock, Number(req.body.priority) || 0, new Date().toISOString()]
    );

    const waitlistEntry = await db.get('SELECT * FROM waitlist WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, data: waitlistEntry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove from waitlist
router.post('/:id/remove', authMiddleware, requireRole('superadmin', 'warden'), async (req, res) => {
  try {
    await db.run('DELETE FROM waitlist WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
