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

    let player = await db.get('SELECT * FROM players WHERE id = $1', [playerId]);

    if (!player) {
      await db.run('INSERT INTO players (id) VALUES ($1)', [playerId]);
      player = await db.get('SELECT * FROM players WHERE id = $1', [playerId]);
    }

    // 登录逻辑判断
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const lastLoginDate = player.last_login_date ? player.last_login_date.split('T')[0] : null;

    let showOnboarding = false;
    let showDailyLogin = false;

    // 1. 新手引导判断
    if (!player.has_seen_onboarding) {
      showOnboarding = true;
      // 立即标记为已读，防止刷新重复触发
      await db.run('UPDATE players SET "has_seen_onboarding" = true WHERE id = $1', [playerId]);
    } 
    // 2. 每日登录判断 (仅在非首次登录时检查)
    else if (lastLoginDate !== todayStr) {
      showDailyLogin = true;
      // 更新最后登录日期
      await db.run('UPDATE players SET "last_login_date" = $1 WHERE id = $2', [todayStr, playerId]);
    }

    // 构造返回的玩家数据，移除敏感字段
    const safePlayer = {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      money: player.money,
      idleRate: player.idleRate,
      bonus: player.bonus,
      currentSeat: player.currentSeat,
      seatCooldown: player.seatCooldown,
      totalIdleTime: player.totalIdleTime,
      totalMoneyEarned: player.totalMoneyEarned,
      totalGachaCount: player.totalGachaCount,
      lastSave: player.lastSave,
      createdAt: player.createdAt,
      // 新增状态字段
      showOnboarding,
      showDailyLogin
    };

    res.json({ playerId, player: safePlayer });
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
    
    // 严格防御性编程：拦截 NaN、null、undefined 及非法类型，确保数据库写入安全
    // 1. idleRate 和 bonus：使用 Number.isNaN 检查，保留合法的 0 值
    const safeIdleRate = Number.isNaN(Number(idleRate)) ? 1 : Number(idleRate);
    const safeBonus = Number.isNaN(Number(bonus)) ? 1.0 : Number(bonus);
    
    let backendEarnings = 0;
    if (player.currentSeat && elapsed > 0) {
      backendEarnings = Math.floor(elapsed * safeIdleRate * safeBonus);
    }

    // 异常收益监控：如果单次结算超过 10000 金币，记录警告日志
    if (backendEarnings > 10000) {
      console.warn(`⚠️ [SUSPICIOUS] Player ${req.params.id} earned ${backendEarnings} gold in ${elapsed}s`);
    }
    
    // 2. 金币与统计字段：后端作为唯一真理来源，防止客户端作弊
    // 使用后端计算的增量累加到数据库现有值上
    const finalMoney = (Number(player.money) || 0) + backendEarnings;
    const finalTotalMoneyEarned = (Number(player.totalMoneyEarned) || 0) + backendEarnings;
    const finalTotalIdleTime = (Number(totalIdleTime) || 0) + elapsed;
    
    // 3. currentSeat：显式检查 NaN，防止字符串 ID 被误转，同时拦截 NaN
    const safeCurrentSeat = Number.isNaN(Number(currentSeat)) ? null : currentSeat;
    
    await db.run(`
      UPDATE players SET
        "money" = $1, "idleRate" = $2, "bonus" = $3,
        "currentSeat" = $4, "seatCooldown" = $5, "totalIdleTime" = $6,
        "totalMoneyEarned" = $7, "totalGachaCount" = $8, "lastSave" = EXTRACT(EPOCH FROM NOW())::INTEGER
      WHERE id = $9
    `, [finalMoney, safeIdleRate, safeBonus, safeCurrentSeat, Number(seatCooldown) || 0, finalTotalIdleTime, finalTotalMoneyEarned, Number(totalGachaCount) || 0, req.params.id]);
    
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
