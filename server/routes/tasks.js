const express = require('express');
const router = express.Router();
const db = require('../models/db');

// --- Daily Tasks ---

router.get('/:playerId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const tasks = await db.all(`
      SELECT dt."id", dt."date", dt."description", dt."target", dt."reward", dt."type", COALESCE(pt."progress", 0) as "progress", COALESCE(pt."claimed", 0) as "claimed"
      FROM daily_tasks dt
      LEFT JOIN player_tasks pt ON dt."id" = pt."taskId" AND pt."playerId" = $1
      WHERE dt."date" = $2
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

    const tasks = await db.all('SELECT "id", "date", "description", "target", "reward", "type" FROM daily_tasks WHERE "date" = $1 AND "type" = $2', [today, type]);

    for (const task of tasks) {
      const playerTask = await db.get('SELECT * FROM player_tasks WHERE "playerId" = $1 AND "taskId" = $2',
        [playerId, task.id]);

      if (playerTask && playerTask.claimed) continue;

      if (playerTask) {
        const newProgress = Math.min(playerTask.progress + value, task.target);
        await db.run('UPDATE player_tasks SET "progress" = $1 WHERE "id" = $2',
          [newProgress, playerTask.id]);
      } else {
        const newProgress = Math.min(value, task.target);
        await db.run('INSERT INTO player_tasks ("playerId", "taskId", "progress") VALUES ($1, $2, $3)',
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

    const task = await db.get('SELECT "id", "date", "description", "target", "reward", "type" FROM daily_tasks WHERE "id" = $1', [taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const playerTask = await db.get('SELECT * FROM player_tasks WHERE "playerId" = $1 AND "taskId" = $2',
      [playerId, taskId]);

    if (!playerTask || playerTask.progress < task.target) {
      return res.status(400).json({ error: 'Task not completed' });
    }

    if (playerTask.claimed) {
      return res.status(400).json({ error: 'Reward already claimed' });
    }

    const reward = JSON.parse(task.reward);

    if (reward.money) {
      await db.run('UPDATE players SET "money" = "money" + $1 WHERE id = $2', [reward.money, playerId]);
    }

    await db.run('UPDATE player_tasks SET "claimed" = 1 WHERE "id" = $1', [playerTask.id]);

    res.json({ success: true, reward });
  } catch (err) {
    console.error('Task claim error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Clock In ---

router.post('/clock-in', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { playerId } = req.body;
    await client.query('BEGIN');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = now.toISOString().slice(0, 7); // YYYY-MM
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const record = await client.query(
      'SELECT * FROM player_clock_ins WHERE "playerId" = $1 AND "month" = $2',
      [playerId, monthStr]
    );

    const row = record.rows[0];
    if (row && row.last_clock_in === todayStr) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '今日已打卡' });
    }

    if (row) {
      await client.query(
        'UPDATE player_clock_ins SET "count" = "count" + 1, "last_clock_in" = $1 WHERE "playerId" = $2 AND "month" = $3',
        [todayStr, playerId, monthStr]
      );
    } else {
      await client.query(
        'INSERT INTO player_clock_ins ("playerId", "month", "count", "last_clock_in") VALUES ($1, $2, 1, $3)',
        [playerId, monthStr, todayStr]
      );
    }

    // Give 50 gold
    await client.query('UPDATE players SET "money" = "money" + 50 WHERE id = $1', [playerId]);

    // Get updated count
    const updated = await client.query('SELECT "count" FROM player_clock_ins WHERE "playerId" = $1 AND "month" = $2', [playerId, monthStr]);
    
    await client.query('COMMIT');
    res.json({ success: true, count: updated.rows[0].count, daysInMonth });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Clock-in error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.get('/clock-in/:playerId', async (req, res) => {
  try {
    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7);
    const todayStr = now.toISOString().split('T')[0];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const record = await db.get(
      'SELECT "count", "last_clock_in" FROM player_clock_ins WHERE "playerId" = $1 AND "month" = $2',
      [req.params.playerId, monthStr]
    );

    res.json({
      count: record?.count || 0,
      daysInMonth,
      clockedInToday: record?.last_clock_in === todayStr
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Achievements ---

router.get('/achievements/:playerId', async (req, res) => {
  try {
    const achievements = await db.all('SELECT * FROM achievements ORDER BY "id"');
    const playerAchievements = await db.all(
      'SELECT "achievementId", "claimed" FROM player_achievements WHERE "playerId" = $1',
      [req.params.playerId]
    );
    const playerMap = {};
    playerAchievements.forEach(pa => playerMap[pa.achievementId] = pa);

    const player = await db.get('SELECT * FROM players WHERE id = $1', [req.params.playerId]);

    const result = achievements.map(a => {
      const currentValue = player[a.condition_field.toLowerCase()] || 0;
      const isUnlocked = currentValue >= a.condition_value;
      const playerStatus = playerMap[a.id];
      
      return {
        ...a,
        currentValue,
        isUnlocked,
        claimed: playerStatus?.claimed || false
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/achievements/check/:playerId', async (req, res) => {
  try {
    const player = await db.get('SELECT * FROM players WHERE id = $1', [req.params.playerId]);
    const achievements = await db.all('SELECT * FROM achievements');
    const existing = await db.all('SELECT "achievementId" FROM player_achievements WHERE "playerId" = $1', [req.params.playerId]);
    const existingMap = new Set(existing.map(e => e.achievementId));

    let unlockedCount = 0;
    for (const a of achievements) {
      if (!existingMap.has(a.id)) {
        const currentValue = player[a.condition_field.toLowerCase()] || 0;
        if (currentValue >= a.condition_value) {
          await db.run(
            'INSERT INTO player_achievements ("playerId", "achievementId") VALUES ($1, $2)',
            [req.params.playerId, a.id]
          );
          unlockedCount++;
        }
      }
    }
    res.json({ success: true, unlockedCount });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/achievements/claim/:playerId/:id', async (req, res) => {
  try {
    const { playerId, id } = req.params;
    
    const achievement = await db.get('SELECT * FROM achievements WHERE "id" = $1', [id]);
    if (!achievement) return res.status(404).json({ error: 'Achievement not found' });

    const playerAchievement = await db.get(
      'SELECT * FROM player_achievements WHERE "playerId" = $1 AND "achievementId" = $2',
      [playerId, id]
    );

    if (!playerAchievement) return res.status(400).json({ error: 'Achievement not unlocked' });
    if (playerAchievement.claimed) return res.status(400).json({ error: 'Reward already claimed' });

    await db.run('UPDATE players SET "money" = "money" + $1 WHERE id = $2', [achievement.reward_money, playerId]);
    await db.run('UPDATE player_achievements SET "claimed" = TRUE WHERE "playerId" = $1 AND "achievementId" = $2', [playerId, id]);

    res.json({ success: true, reward: achievement.reward_money });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Shared Task Progress Logic ---

async function updateTaskProgress(playerId, type, value, client = null) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Helper to run query with or without transaction client
    const runQuery = async (query, params) => {
      if (client) {
        return client.query(query, params);
      } else {
        return db.run(query, params); // db.run returns { changes }
      }
    };
    
    const getQuery = async (query, params) => {
      if (client) {
        const res = await client.query(query, params);
        return res.rows[0] || null;
      } else {
        return db.get(query, params);
      }
    };

    const allQuery = async (query, params) => {
      if (client) {
        const res = await client.query(query, params);
        return res.rows;
      } else {
        return db.all(query, params);
      }
    };

    const tasks = await allQuery(
      'SELECT "id", "date", "description", "target", "reward", "type" FROM daily_tasks WHERE "date" = $1 AND "type" = $2', 
      [today, type]
    );

    for (const task of tasks) {
      const playerTask = await getQuery(
        'SELECT * FROM player_tasks WHERE "playerId" = $1 AND "taskId" = $2',
        [playerId, task.id]
      );

      if (playerTask && playerTask.claimed) continue;

      if (playerTask) {
        const newProgress = Math.min(playerTask.progress + value, task.target);
        await runQuery(
          'UPDATE player_tasks SET "progress" = $1 WHERE "id" = $2',
          [newProgress, playerTask.id]
        );
      } else {
        const newProgress = Math.min(value, task.target);
        await runQuery(
          'INSERT INTO player_tasks ("playerId", "taskId", "progress") VALUES ($1, $2, $3)',
          [playerId, task.id, newProgress]
        );
      }
    }
  } catch (err) {
    console.error(`Error updating task progress for type ${type}:`, err);
  }
}

module.exports = router;
module.exports.updateTaskProgress = updateTaskProgress;
