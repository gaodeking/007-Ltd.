const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.post('/status', async (req, res) => {
  try {
    const { playerId, activityId } = req.body;
    
    if (!playerId || !activityId) {
      return res.status(400).json({ error: 'Missing playerId or activityId' });
    }
    
    // 验证是否为重度活动
    const isHeavy = await db.get(
      'SELECT 1 FROM heavy_activities WHERE activity_id = $1 AND active = TRUE',
      [activityId]
    );
    
    if (!isHeavy) {
      return res.status(400).json({ error: '该活动不触发摸鱼状态' });
    }
    
    // 检查玩家是否在座
    const player = await db.get('SELECT "currentSeat" FROM players WHERE id = $1', [playerId]);
    if (!player || !player.currentSeat) {
      return res.status(400).json({ error: '请先入座再参与活动' });
    }
    
    await db.run(
      'UPDATE players SET "activityStatus" = $1 WHERE id = $2',
      [activityId, playerId]
    );
    
    res.json({ success: true, activityStatus: activityId });
  } catch (err) {
    console.error('Error in /activity/status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/status/clear', async (req, res) => {
  try {
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Missing playerId' });
    }
    
    await db.run(
      'UPDATE players SET "activityStatus" = NULL WHERE id = $1',
      [playerId]
    );
    
    res.json({ success: true, activityStatus: null });
  } catch (err) {
    console.error('Error in /activity/status/clear:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
