const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', async (req, res) => {
  try {
    const announcement = await db.get(
      'SELECT id, content, version, created_at FROM announcements WHERE active = true ORDER BY created_at DESC LIMIT 1'
    );
    res.json(announcement || null);
  } catch (err) {
    console.error('Error in /announcements:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
