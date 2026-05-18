const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const { updateTaskProgress } = require('./tasks');

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

    // 仅更新心跳，不再自动释放座位（座位仅在手动点击"起身离开"时释放）
    const now = Math.floor(Date.now() / 1000);
    await db.run('UPDATE players SET "lastHeartbeat" = $1 WHERE id = $2', [now, playerId]);

    // 登录逻辑判断
    const todayStr = new Date().toLocaleDateString('sv-SE'); 
    
    let lastLoginDate = null;
    if (player.last_login_date) {
      try {
        const dateObj = new Date(player.last_login_date);
        if (!isNaN(dateObj.getTime())) {
          lastLoginDate = dateObj.toLocaleDateString('sv-SE');
        }
      } catch (e) {
        console.error('Date parsing failed for last_login_date:', e);
      }
    }

    let showOnboarding = false;
    let showDailyLogin = false;

    if (!player.has_seen_onboarding) {
      showOnboarding = true;
      await db.run('UPDATE players SET "has_seen_onboarding" = true WHERE id = $1', [playerId]);
    } 
    else if (lastLoginDate !== todayStr) {
      showDailyLogin = true;
      await db.run('UPDATE players SET "last_login_date" = $1 WHERE id = $2', [todayStr, playerId]);
    }

    const safePlayer = {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      money: player.money,
      idleRate: player.idleRate,
      bonus: player.bonus,
      currentSeat: player.currentSeat,
      seatCooldown: player.seatCooldown,
      totalidletime: player.totalidletime,
      totalmoneyearned: player.totalmoneyearned,
      totalgachacount: player.totalgachacount,
      lastSave: player.lastSave,
      activityStatus: player.activityStatus || null,
      createdAt: player.createdAt,
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
    const player = await db.get('SELECT "id", "name", "avatar", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalidletime", "totalmoneyearned", "totalgachacount", "lastSave", "createdAt" FROM players WHERE id = $1', [req.params.id]);
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
    
    const { money, idleRate, bonus, currentSeat, seatCooldown, totalidletime, totalmoneyearned, totalgachacount } = req.body;
    
    // 严格防御性编程：拦截 NaN、null、undefined 及非法类型，确保数据库写入安全
    // 1. idleRate 和 bonus：使用 Number.isNaN 检查，保留合法的 0 值
    const safeIdleRate = Number.isNaN(Number(idleRate)) ? 1 : Number(idleRate);
    const safeBonus = Number.isNaN(Number(bonus)) ? 1.0 : Number(bonus);
    
    let backendEarnings = 0;
    let effectiveElapsed = 0;
    
    // 心跳验证：判定玩家是否在线（60秒无心跳视为离线）
    const heartbeatThreshold = 60;
    const isOffline = !player.lastHeartbeat || (now - player.lastHeartbeat > heartbeatThreshold);
    
    if (!isOffline && player.currentSeat && elapsed > 0) {
      // 在线且有座位：正常计算收益
      backendEarnings = Math.floor(elapsed * safeIdleRate * safeBonus);
      effectiveElapsed = elapsed;
    } else if (isOffline) {
      // 离线：无收益，不计入在线时长
      backendEarnings = 0;
      effectiveElapsed = 0;
      console.log(`[OFFLINE] Player ${req.params.id} detected offline (lastHeartbeat: ${player.lastHeartbeat}, now: ${now})`);
    }

    // 异常收益监控：如果单次结算超过 10000 金币，记录警告日志
    if (backendEarnings > 10000) {
      console.warn(`⚠️ [SUSPICIOUS] Player ${req.params.id} earned ${backendEarnings} gold in ${elapsed}s`);
    }
    
    // 前端 money 校验：防止浏览器节流、网络延迟等导致的前端累加偏差
    const frontendMoney = Number(money) || 0;
    const dbMoney = Number(player.money) || 0;
    const frontendMoneyDiff = frontendMoney - dbMoney;
    const expectedDiff = backendEarnings;
    // 容差阈值：50% 误差 或 50 金币，取较大值
    const tolerance = Math.max(expectedDiff * 0.5, 50);
    
    let finalMoney;
    let finalTotalMoneyEarned;
    
    if (player.currentSeat && Math.abs(frontendMoneyDiff - expectedDiff) > tolerance) {
      // 校验失败：前端值偏差过大，强制使用后端计算值
      console.warn(`⚠️ [MONEY MISMATCH] Player ${req.params.id}: FrontendDiff=${frontendMoneyDiff}, BackendDiff=${expectedDiff}, Tolerance=${tolerance}`);
      finalMoney = dbMoney + backendEarnings;
      finalTotalMoneyEarned = (Number(player.totalmoneyearned) || 0) + backendEarnings;
    } else {
      // 校验通过：信任前端累加值，但仍加上后端计算的增量（防止前端漏加）
      finalMoney = frontendMoney + backendEarnings;
      finalTotalMoneyEarned = (Number(totalmoneyearned) || 0) + backendEarnings;
    }
    
    const finalTotalIdleTime = (Number(player.totalidletime) || 0) + effectiveElapsed;
    
    // 3. currentSeat：显式检查 NaN，防止字符串 ID 被误转，同时拦截 NaN
    const safeCurrentSeat = Number.isNaN(Number(currentSeat)) ? null : currentSeat;
    
    await db.run(`
      UPDATE players SET
        "money" = $1, "idleRate" = $2, "bonus" = $3,
        "currentSeat" = $4, "seatCooldown" = $5, "totalidletime" = $6,
        "totalmoneyearned" = $7, "totalgachacount" = $8, "lastSave" = EXTRACT(EPOCH FROM NOW())::INTEGER
      WHERE id = $9
    `, [finalMoney, safeIdleRate, safeBonus, safeCurrentSeat, Number(seatCooldown) || 0, finalTotalIdleTime, finalTotalMoneyEarned, Number(totalgachacount) || 0, req.params.id]);
    
    // Update daily task progress
    // Only update if player is seated and earned something
    if (player.currentSeat && effectiveElapsed > 0) {
      await updateTaskProgress(req.params.id, 'idle_time', effectiveElapsed);
      await updateTaskProgress(req.params.id, 'money_earned', backendEarnings);
    }
    
    res.json({ success: true, backendEarnings, money: finalMoney, totalmoneyearned: finalTotalMoneyEarned, totalidletime: finalTotalIdleTime });
  } catch (err) {
    console.error('Error in /save:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/offline-earnings', async (req, res) => {
  try {
    const player = await db.get('SELECT "id", "name", "avatar", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalidletime", "totalmoneyearned", "totalgachacount", "lastSave", "createdAt" FROM players WHERE id = $1', [req.params.id]);
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
    const player = await db.get('SELECT "id", "name", "avatar", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalidletime", "totalmoneyearned", "totalgachacount", "lastSave", "createdAt" FROM players WHERE id = $1', [req.params.id]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const now = Math.floor(Date.now() / 1000);
    const offlineSeconds = now - player.lastSave;
    const maxOfflineSeconds = 8 * 3600;
    const effectiveSeconds = Math.min(offlineSeconds, maxOfflineSeconds);
    const earnings = Math.floor(effectiveSeconds * player.idleRate * player.bonus);

    if (earnings > 0) {
      await db.run('UPDATE players SET "money" = "money" + $1, "totalmoneyearned" = "totalmoneyearned" + $1, "lastSave" = $2 WHERE id = $3',
        [earnings, now, req.params.id]);
    }

    res.json({ earnings, newMoney: player.money + earnings });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/heartbeat', async (req, res) => {
  try {
    const { activityStatus } = req.body;
    const now = Math.floor(Date.now() / 1000);
    
    if (activityStatus !== undefined) {
      await db.run(
        'UPDATE players SET "lastHeartbeat" = $1, "activityStatus" = $2 WHERE id = $3',
        [now, activityStatus || null, req.params.id]
      );
    } else {
      await db.run(
        'UPDATE players SET "lastHeartbeat" = $1 WHERE id = $2',
        [now, req.params.id]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error in /heartbeat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
