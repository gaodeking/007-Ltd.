const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/:playerId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const tasks = await db.all(`
      SELECT dt.*, COALESCE(pt.progress, 0) as progress, COALESCE(pt.claimed, 0) as claimed
      FROM daily_tasks dt
      LEFT JOIN player_tasks pt ON dt.id = pt.taskId AND pt.playerId = $1
      WHERE dt.date = $2
    `, [req.params.playerId, today]);

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/progress', async (req, res) => {
  try {
    const { playerId, type, value } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const tasks = await db.all('SELECT * FROM daily_tasks WHERE date = $1 AND type = $2', [today, type]);

    for (const task of tasks) {
      const playerTask = await db.get('SELECT * FROM player_tasks WHERE playerId = $1 AND taskId = $2',
        [playerId, task.id]);

      if (playerTask && playerTask.claimed) continue;

      if (playerTask) {
        const newProgress = Math.min(playerTask.progress + value, task.target);
        await db.run('UPDATE player_tasks SET progress = $1 WHERE id = $2',
          [newProgress, playerTask.id]);
      } else {
        const newProgress = Math.min(value, task.target);
        await db.run('INSERT INTO player_tasks (playerId, taskId, progress) VALUES ($1, $2, $3)',
          [playerId, task.id, newProgress]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/claim', async (req, res) => {
  try {
    const { playerId, taskId } = req.body;

    const task = await db.get('SELECT * FROM daily_tasks WHERE id = $1', [taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const playerTask = await db.get('SELECT * FROM player_tasks WHERE playerId = $1 AND taskId = $2',
      [playerId, taskId]);

    if (!playerTask || playerTask.progress < task.target) {
      return res.status(400).json({ error: 'Task not completed' });
    }

    if (playerTask.claimed) {
      return res.status(400).json({ error: 'Reward already claimed' });
    }

    const reward = JSON.parse(task.reward);

    if (reward.money) {
      await db.run('UPDATE players SET money = money + $1 WHERE id = $2', [reward.money, playerId]);
    }
    if (reward.ticket) {
      await db.run('UPDATE players SET ticket = ticket + $1 WHERE id = $2', [reward.ticket, playerId]);
    }
    if (reward.hair) {
      await db.run('UPDATE players SET hair = hair + $1 WHERE id = $2', [reward.hair, playerId]);
    }

    await db.run('UPDATE player_tasks SET claimed = 1 WHERE id = $1', [playerTask.id]);

    res.json({ success: true, reward });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
