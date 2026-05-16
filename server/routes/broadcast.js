const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', async (req, res) => {
  try {
    const messages = await db.all(
      'SELECT id, content, rarity, created_at FROM broadcast_messages ORDER BY created_at DESC LIMIT 5'
    );
    res.json(messages.reverse()); // Return in chronological order (oldest first)
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
