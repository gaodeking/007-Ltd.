const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

router.get('/init', async (req, res) => {
  try {
    let playerId = req.headers['x-player-id'];

    if (!playerId) {
      playerId = uuidv4();
      await db.run('INSERT INTO players (id) VALUES ($1)', [playerId]);
    }

    let player = await db.get('SELECT "id", "name", "avatar", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalIdleTime", "totalMoneyEarned", "totalGachaCount", "lastSave", "createdAt" FROM players WHERE id = $1', [playerId]);

    if (!player) {
      await db.run('INSERT INTO players (id) VALUES ($1)', [playerId]);
      player = await db.get('SELECT "id", "name", "avatar", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalIdleTime", "totalMoneyEarned", "totalGachaCount", "lastSave", "createdAt" FROM players WHERE id = $1', [playerId]);
    }

    res.json({ playerId, player });
  } catch (err) {
    console.error('Error in /init:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const player = await db.get('SELECT "id", "name", "avatar", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalIdleTime", "totalMoneyEarned", "totalGachaCount", "lastSave", "createdAt" FROM players WHERE id = $1', [req.params.id]);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/name', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.length > 20) {
      return res.status(400).json({ error: 'Invalid name' });
    }
    await db.run('UPDATE players SET name = $1 WHERE id = $2', [name, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/avatar', async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar || avatar.length > 10) {
      return res.status(400).json({ error: 'Invalid avatar' });
    }
    await db.run('UPDATE players SET avatar = $1 WHERE id = $2', [avatar, req.params.id]);
    res.json({ success: true, avatar });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/save', async (req, res) => {
  try {
    const player = await db.get('SELECT * FROM players WHERE id = $1', [req.params.id]);
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - (player.lastSave || now);
    
    const { money, idleRate, bonus, currentSeat, seatCooldown, totalIdleTime, totalMoneyEarned, totalGachaCount } = req.body;
    
    // 防御性编程：优先使用前端值，其次数据库值，最后默认值，防止 NaN 错误
    const safeIdleRate = idleRate ?? player.idleRate ?? 1;
    const safeBonus = bonus ?? player.bonus ?? 1.0;
    
    let backendEarnings = 0;
    if (player.currentSeat && elapsed > 0) {
      backendEarnings = Math.floor(elapsed * safeIdleRate * safeBonus);
    }
    
    // 调试日志：打印前端传来的原始数据，便于排查 NaN 来源
    console.log('[/save] req.body:', JSON.stringify(req.body));
    
    const finalMoney = Math.max(money ?? 0, (player.money ?? 0) + backendEarnings);
    const finalTotalMoneyEarned = Math.max(totalMoneyEarned ?? 0, (player.totalMoneyEarned ?? 0) + backendEarnings);
    const finalTotalIdleTime = (totalIdleTime ?? 0) + elapsed;
    
    await db.run(`
      UPDATE players SET
        "money" = $1, "idleRate" = $2, "bonus" = $3,
        "currentSeat" = $4, "seatCooldown" = $5, "totalIdleTime" = $6,
        "totalMoneyEarned" = $7, "totalGachaCount" = $8, "lastSave" = EXTRACT(EPOCH FROM NOW())::INTEGER
      WHERE id = $9
    `, [finalMoney, safeIdleRate, safeBonus, currentSeat ?? null, seatCooldown ?? 0, finalTotalIdleTime, finalTotalMoneyEarned, totalGachaCount ?? 0, req.params.id]);
    
    res.json({ success: true, backendEarnings });
  } catch (err) {
    console.error('Error in /save:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/offline-earnings', async (req, res) => {
  try {
    const player = await db.get('SELECT "id", "name", "avatar", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalIdleTime", "totalMoneyEarned", "totalGachaCount", "lastSave", "createdAt" FROM players WHERE id = $1', [req.params.id]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const now = Math.floor(Date.now() / 1000);
    const offlineSeconds = now - player.lastSave;
    const maxOfflineSeconds = 8 * 3600;
    const effectiveSeconds = Math.min(offlineSeconds, maxOfflineSeconds);

    const earnings = Math.floor(effectiveSeconds * player.idleRate * player.bonus);

    res.json({
      offlineSeconds: effectiveSeconds,
      earnings,
      canClaim: earnings > 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/claim-offline', async (req, res) => {
  try {
    const player = await db.get('SELECT "id", "name", "avatar", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalIdleTime", "totalMoneyEarned", "totalGachaCount", "lastSave", "createdAt" FROM players WHERE id = $1', [req.params.id]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const now = Math.floor(Date.now() / 1000);
    const offlineSeconds = now - player.lastSave;
    const maxOfflineSeconds = 8 * 3600;
    const effectiveSeconds = Math.min(offlineSeconds, maxOfflineSeconds);
    const earnings = Math.floor(effectiveSeconds * player.idleRate * player.bonus);

    if (earnings > 0) {
      await db.run('UPDATE players SET "money" = "money" + $1, "totalMoneyEarned" = "totalMoneyEarned" + $1, "lastSave" = $2 WHERE id = $3',
        [earnings, now, req.params.id]);
    }

    res.json({ earnings, newMoney: player.money + earnings });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/heartbeat', async (req, res) => {
  try {
    await db.run('UPDATE players SET "lastHeartbeat" = EXTRACT(EPOCH FROM NOW())::INTEGER WHERE id = $1',
      [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in /heartbeat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
