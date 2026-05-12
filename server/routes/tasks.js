const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Get today's tasks for a player
router.get('/:playerId', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const tasks = db.all(`
    SELECT dt.*, COALESCE(pt.progress, 0) as progress, COALESCE(pt.claimed, 0) as claimed
    FROM daily_tasks dt
    LEFT JOIN player_tasks pt ON dt.id = pt.taskId AND pt.playerId = ?
    WHERE dt.date = ?
  `, [req.params.playerId, today]);
  
  res.json(tasks);
});

// Update task progress
router.post('/progress', (req, res) => {
  const { playerId, type, value } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  const tasks = db.all('SELECT * FROM daily_tasks WHERE date = ? AND type = ?', [today, type]);
  
  for (const task of tasks) {
    const playerTask = db.get('SELECT * FROM player_tasks WHERE playerId = ? AND taskId = ?',
      [playerId, task.id]);
    
    if (playerTask && playerTask.claimed) continue;
    
    if (playerTask) {
      const newProgress = Math.min(playerTask.progress + value, task.target);
      db.run('UPDATE player_tasks SET progress = ? WHERE id = ?',
        [newProgress, playerTask.id]);
    } else {
      const newProgress = Math.min(value, task.target);
      db.run('INSERT INTO player_tasks (playerId, taskId, progress) VALUES (?, ?, ?)',
        [playerId, task.id, newProgress]);
    }
  }
  
  res.json({ success: true });
});

// Claim task reward
router.post('/claim', (req, res) => {
  const { playerId, taskId } = req.body;
  
  const task = db.get('SELECT * FROM daily_tasks WHERE id = ?', [taskId]);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  
  const playerTask = db.get('SELECT * FROM player_tasks WHERE playerId = ? AND taskId = ?',
    [playerId, taskId]);
  
  if (!playerTask || playerTask.progress < task.target) {
    return res.status(400).json({ error: 'Task not completed' });
  }
  
  if (playerTask.claimed) {
    return res.status(400).json({ error: 'Reward already claimed' });
  }
  
  const reward = JSON.parse(task.reward);
  
  if (reward.money) {
    db.run('UPDATE players SET money = money + ? WHERE id = ?', [reward.money, playerId]);
  }
  if (reward.ticket) {
    db.run('UPDATE players SET ticket = ticket + ? WHERE id = ?', [reward.ticket, playerId]);
  }
  if (reward.hair) {
    db.run('UPDATE players SET hair = hair + ? WHERE id = ?', [reward.hair, playerId]);
  }
  
  db.run('UPDATE player_tasks SET claimed = 1 WHERE id = ?', [playerTask.id]);
  
  res.json({ success: true, reward });
});

module.exports = router;
