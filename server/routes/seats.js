const express = require('express');
const router = express.Router();
const db = require('../models/db');

const SEAT_COOLDOWN = 300;

router.get('/', async (req, res) => {
  try {
    const seats = await db.all(`
      SELECT s.*, p.name as playerName
      FROM seats s
      LEFT JOIN players p ON s.playerId = p.id
      ORDER BY s.seatId
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

    const player = await db.get('SELECT * FROM players WHERE id = $1', [playerId]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const now = Math.floor(Date.now() / 1000);
    if (player.seatCooldown > now) {
      const remaining = player.seatCooldown - now;
      return res.status(400).json({ error: `换座冷却中，剩余 ${remaining} 秒`, cooldown: remaining });
    }

    const seat = await db.get('SELECT * FROM seats WHERE seatId = $1', [seatId]);
    if (seat.playerId) {
      return res.status(400).json({ error: '该座位已被占用' });
    }

    if (player.currentSeat) {
      await db.run('UPDATE seats SET playerId = NULL WHERE seatId = $1', [player.currentSeat]);
    }

    await db.run('UPDATE seats SET playerId = $1 WHERE seatId = $2', [playerId, seatId]);
    await db.run('UPDATE players SET currentSeat = $1, seatCooldown = $2 WHERE id = $3',
      [seatId, now + SEAT_COOLDOWN, playerId]);

    res.json({ success: true, seatId });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/leave', async (req, res) => {
  try {
    const { playerId } = req.body;

    const player = await db.get('SELECT * FROM players WHERE id = $1', [playerId]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    if (!player.currentSeat) {
      return res.status(400).json({ error: '当前未在座位上' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (player.seatCooldown > now) {
      const remaining = player.seatCooldown - now;
      return res.status(400).json({ error: `换座冷却中，剩余 ${remaining} 秒`, cooldown: remaining });
    }

    await db.run('UPDATE seats SET playerId = NULL WHERE seatId = $1', [player.currentSeat]);
    await db.run('UPDATE players SET currentSeat = NULL, seatCooldown = $1 WHERE id = $2',
      [now + SEAT_COOLDOWN, playerId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
