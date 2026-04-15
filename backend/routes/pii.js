const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/env');

// Get PII deletion logs
router.get('/', authMiddleware, requireRole('superadmin'), async (req, res) => {
  try {
    const logs = await db.all('SELECT * FROM pii_deletion_log ORDER BY deleted_at DESC LIMIT 100', []);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/cleanup', authMiddleware, requireRole('superadmin'), async (req, res) => {
  try {
    const retentionDays = Number(req.body.retention_days) || 90;
    if (retentionDays <= 0) {
      return res.status(400).json({ success: false, message: 'Retention days must be greater than 0' });
    }

    const cutoff = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000)).toISOString();
    const staleRequests = await db.all(
      `SELECT id, id_proof_path
       FROM guest_visit_requests
       WHERE id_proof_path IS NOT NULL
         AND created_at < ?
         AND status IN ('rejected', 'cancelled', 'completed')`,
      [cutoff]
    );

    let deletedCount = 0;

    for (const request of staleRequests) {
      const filePath = path.join(config.FILE_UPLOAD_DIR, request.id_proof_path);

      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      await db.run(
        'UPDATE guest_visit_requests SET id_proof_path = NULL, id_proof_hash = NULL WHERE id = ?',
        [request.id]
      );

      await db.run(
        'INSERT INTO pii_deletion_log (table_name, record_id, reason) VALUES (?, ?, ?)',
        ['guest_visit_requests', String(request.id), `Deleted ID proof older than ${retentionDays} days`]
      );

      deletedCount += 1;
    }

    res.json({
      success: true,
      data: { deleted_count: deletedCount },
      message: `PII cleanup completed. ${deletedCount} file(s) removed.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
