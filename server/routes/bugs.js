const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.post('/', async (req, res) => {
  try {
    const { playerId, description } = req.body;

    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: '描述太短，请至少输入 5 个字符' });
    }

    const trimmedDesc = description.trim();

    // 查重逻辑：检查该玩家是否提交过完全相同的描述
    const existing = await db.get(
      'SELECT id FROM bug_reports WHERE player_id = $1 AND description = $2',
      [playerId, trimmedDesc]
    );

    if (existing) {
      return res.status(400).json({ error: '您已提交过相同的反馈，请勿重复提交' });
    }

    await db.run(
      'INSERT INTO bug_reports (player_id, description, status) VALUES ($1, $2, $3)',
      [playerId, trimmedDesc, 'pending']
    );

    res.json({ success: true, message: '感谢反馈，我们会尽快处理' });
  } catch (err) {
    console.error('Error in /bugs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
