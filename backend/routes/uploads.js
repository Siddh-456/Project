const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');
const config = require('../config/env');
const { getStudentRecordByUserId } = require('../utils/student');

// Get file info and validate access
router.get('/:filename', authMiddleware, async (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadsRoot = path.resolve(config.FILE_UPLOAD_DIR);
    const filePath = path.resolve(uploadsRoot, filename);

    // Security: Prevent directory traversal
    if (!filePath.startsWith(uploadsRoot)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Only staff can download files, or students can download their own
    if (req.user.role === 'student') {
      const student = await getStudentRecordByUserId(req.user.id);
      if (!student) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const attachment = await db.get(
        'SELECT id FROM guest_visit_requests WHERE id_proof_path = ? AND host_student_id = ?',
        [filename, student.id]
      );

      if (!attachment) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    } else if (!['superadmin', 'warden', 'accountant', 'caretaker'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Staff access required' });
    }

    // Send file
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete file (staff only)
router.delete('/:filename', authMiddleware, requireRole('superadmin', 'warden', 'caretaker'), async (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadsRoot = path.resolve(config.FILE_UPLOAD_DIR);
    const filePath = path.resolve(uploadsRoot, filename);

    // Security: Prevent directory traversal
    if (!filePath.startsWith(uploadsRoot)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Delete file
    await fs.unlink(filePath);
    await db.run(
      'UPDATE guest_visit_requests SET id_proof_path = NULL, id_proof_hash = NULL WHERE id_proof_path = ?',
      [filename]
    );
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
