const express = require('express');
const router = express.Router();
const db = require('../models/db');

const SEAT_TIMEOUT = 120;
const FIRST_SIT_COOLDOWN = 2;
const CHANGE_SEAT_COOLDOWN = 2;
const LEAVE_SEAT_COOLDOWN = 2;

router.get('/', async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    const timeoutSeats = await db.all(`
      SELECT s."seatId", s."playerId"
      FROM seats s
      JOIN players p ON s."playerId" = p.id
      WHERE s."playerId" IS NOT NULL 
        AND (p."lastHeartbeat" IS NULL OR p."lastHeartbeat" < $1)
    `, [now - SEAT_TIMEOUT]);
    
    for (const seat of timeoutSeats) {
      await db.run('UPDATE seats SET "playerId" = NULL WHERE "seatId" = $1', [seat.seatId]);
      await db.run('UPDATE players SET "currentSeat" = NULL WHERE id = $1', [seat.playerId]);
    }
    
    const seats = await db.all(`
      SELECT s."seatId" as "seatId", s."playerId" as "playerId", s.bonus, s.position, p.name as "playerName", p.avatar as "playerAvatar"
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
  try {
    const { playerId } = req.body;
    const seatId = parseInt(req.params.seatId);

    if (seatId < 1 || seatId > 25) {
      return res.status(400).json({ error: 'Invalid seat number' });
    }

    const player = await db.get('SELECT "id", "name", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalIdleTime", "totalMoneyEarned", "totalGachaCount", "lastSave", "createdAt" FROM players WHERE id = $1', [playerId]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const now = Math.floor(Date.now() / 1000);
    if (player.seatCooldown > now) {
      const remaining = player.seatCooldown - now;
      return res.status(400).json({ error: `别急，屁股还没坐热呢`, cooldown: remaining });
    }

    const seat = await db.get('SELECT "seatId", "playerId", "bonus", "position" FROM seats WHERE "seatId" = $1', [seatId]);
    if (seat.playerId) {
      return res.status(400).json({ error: '该座位已被占用' });
    }

    if (player.currentSeat) {
      await db.run('UPDATE seats SET "playerId" = NULL WHERE "seatId" = $1', [player.currentSeat]);
    }

    await db.run('UPDATE seats SET "playerId" = $1 WHERE "seatId" = $2', [playerId, seatId]);
    
    const cooldownDuration = player.currentSeat ? CHANGE_SEAT_COOLDOWN : FIRST_SIT_COOLDOWN;
    await db.run('UPDATE players SET "currentSeat" = $1, "seatCooldown" = $2, "lastHeartbeat" = $3 WHERE id = $4',
      [seatId, now + cooldownDuration, now, playerId]);

    res.json({ success: true, seatId });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/leave', async (req, res) => {
  try {
    const { playerId } = req.body;

    const player = await db.get('SELECT "id", "name", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalIdleTime", "totalMoneyEarned", "totalGachaCount", "lastSave", "createdAt" FROM players WHERE id = $1', [playerId]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    if (!player.currentSeat) {
      return res.status(400).json({ error: '当前未在座位上' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (player.seatCooldown > now) {
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
