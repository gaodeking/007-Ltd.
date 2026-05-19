const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { updateTaskProgress } = require('./tasks');

const FIRST_SIT_COOLDOWN = 2;
const CHANGE_SEAT_COOLDOWN = 2;
const LEAVE_SEAT_COOLDOWN = 2;

// VIP Seat Configuration
const VIP_SEAT_ID = 1;
const VIP_PLAYER_NAMES = ['正版TZHZ'];

router.get('/', async (req, res) => {
  try {
    const seats = await db.all(`
      SELECT s."seatId" as "seatId", s."playerId" as "playerId", s.bonus, s.position, 
             p.name as "playerName", p.avatar as "playerAvatar", 
             p."activityStatus", p."lastHeartbeat"
      FROM seats s
      LEFT JOIN players p ON s."playerId" = p.id
      ORDER BY s."seatId"
    `);
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:seatId/sit', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { playerId } = req.body;
    const seatId = parseInt(req.params.seatId);

    if (seatId < 1 || seatId > 25) {
      return res.status(400).json({ error: 'Invalid seat number' });
    }

    await client.query('BEGIN');

    // Lock player row to prevent race conditions
    const playerRes = await client.query(
      'SELECT * FROM players WHERE id = $1 FOR UPDATE',
      [playerId]
    );
    const player = playerRes.rows[0];

    if (!player) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Player not found' });
    }

    if (player.activityStatus) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '请先关闭活动页面再换座' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (player.seatCooldown > now) {
      await client.query('ROLLBACK');
      const remaining = player.seatCooldown - now;
      return res.status(400).json({ error: `别急，屁股还没坐热呢`, cooldown: remaining });
    }

    // Check seat status inside transaction
    const seatRes = await client.query(
      'SELECT "seatId", "playerId" FROM seats WHERE "seatId" = $1 FOR UPDATE',
      [seatId]
    );
    const seat = seatRes.rows[0];

    if (seat.playerId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '该座位已被占用' });
    }

    // VIP Seat Permission Check
    if (seatId === VIP_SEAT_ID && !VIP_PLAYER_NAMES.includes(player.name)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '这是BOSS专属座位，您无权入座' });
    }

    // Atomic operations: Release old seat + Set new seat + Update player
    if (player.currentSeat) {
      await client.query('UPDATE seats SET "playerId" = NULL WHERE "seatId" = $1', [player.currentSeat]);
    }

    await client.query('UPDATE seats SET "playerId" = $1 WHERE "seatId" = $2', [playerId, seatId]);
    await client.query('UPDATE players SET "activityStatus" = NULL WHERE id = $1', [playerId]);

    const isFirstSit = !player.currentSeat;
    const cooldownDuration = isFirstSit ? FIRST_SIT_COOLDOWN : CHANGE_SEAT_COOLDOWN;

    if (isFirstSit) {
      await client.query(
        'UPDATE players SET "currentSeat" = $1, "seatCooldown" = $2, "lastHeartbeat" = $3, "lastSave" = $4 WHERE id = $5',
        [seatId, now + cooldownDuration, now, now, playerId]
      );
    } else {
      await client.query(
        'UPDATE players SET "currentSeat" = $1, "seatCooldown" = $2, "lastHeartbeat" = $3 WHERE id = $4',
        [seatId, now + cooldownDuration, now, playerId]
      );
    }

    // Update daily task progress for seat_change (only if changing seats, not first sit)
    if (!isFirstSit) {
      await updateTaskProgress(playerId, 'seat_change', 1, client);
    }

    await client.query('COMMIT');
    res.json({ success: true, seatId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/leave', async (req, res) => {
  try {
    const { playerId, force } = req.body;

    const player = await db.get('SELECT "id", "name", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalidletime", "totalmoneyearned", "totalgachacount", "lastSave", "createdAt", "activityStatus" FROM players WHERE id = $1', [playerId]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    if (!player.currentSeat) {
      return res.status(400).json({ error: '当前未在座位上' });
    }

    const now = Math.floor(Date.now() / 1000);
    
    // force=true 时跳过 cooldown 检查（用于页面关闭时的强制释放）
    if (!force && player.seatCooldown > now) {
      const remaining = player.seatCooldown - now;
      return res.status(400).json({ error: `别急，屁股还没坐热呢`, cooldown: remaining });
    }

    await db.run('UPDATE seats SET "playerId" = NULL WHERE "seatId" = $1', [player.currentSeat]);
    await db.run('UPDATE players SET "currentSeat" = NULL, "seatCooldown" = $1 WHERE id = $2',
      [now + LEAVE_SEAT_COOLDOWN, playerId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
