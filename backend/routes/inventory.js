const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const db = require('../config/database');

// Get inventory
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];

    if (req.query.room_id) {
      query += ' AND room_id = ?';
      params.push(req.query.room_id);
    }

    query += ' ORDER BY created_at DESC';
    const inventory = await db.all(query, params);
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create inventory item
router.post('/', authMiddleware, requireRole('superadmin', 'warden', 'caretaker'), async (req, res) => {
  try {
    const result = await db.run(
      `INSERT INTO inventory (room_id, item_name, quantity)
       VALUES (?, ?, ?)`,
      [req.body.room_id || null, req.body.item_name, req.body.quantity || 1]
    );

    const item = await db.get('SELECT * FROM inventory WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update inventory item
router.put('/:id', authMiddleware, requireRole('superadmin', 'warden', 'caretaker'), async (req, res) => {
  try {
    const updates = [];
    const values = [];

    if (req.body.item_name) {
      updates.push('item_name = ?');
      values.push(req.body.item_name);
    }
    if (req.body.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(req.body.quantity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(req.params.id);
    await db.run(`UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`, values);

    const item = await db.get('SELECT * FROM inventory WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authMiddleware, requireRole('superadmin', 'warden', 'caretaker'), async (req, res) => {
  try {
    await db.run('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
