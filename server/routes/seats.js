const express = require('express');
const router = express.Router();
const db = require('../models/db');

const SEAT_COOLDOWN = 300;

// Get all seats
router.get('/', (req, res) => {
  const seats = db.all(`
    SELECT s.*, p.name as playerName 
    FROM seats s 
    LEFT JOIN players p ON s.playerId = p.id
    ORDER BY s.seatId
  `);
  res.json(seats);
});

// Sit on a seat
router.post('/:seatId/sit', (req, res) => {
  const { playerId } = req.body;
  const seatId = parseInt(req.params.seatId);
  
  if (seatId < 1 || seatId > 25) {
    return res.status(400).json({ error: 'Invalid seat number' });
  }
  
  const player = db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  
  const now = Math.floor(Date.now() / 1000);
  if (player.seatCooldown > now) {
    const remaining = player.seatCooldown - now;
    return res.status(400).json({ error: `换座冷却中，剩余 ${remaining} 秒`, cooldown: remaining });
  }
  
  const seat = db.get('SELECT * FROM seats WHERE seatId = ?', [seatId]);
  if (seat.playerId) {
    return res.status(400).json({ error: '该座位已被占用' });
  }
  
  if (player.currentSeat) {
    db.run('UPDATE seats SET playerId = NULL WHERE seatId = ?', [player.currentSeat]);
  }
  
  db.run('UPDATE seats SET playerId = ? WHERE seatId = ?', [playerId, seatId]);
  db.run('UPDATE players SET currentSeat = ?, seatCooldown = ? WHERE id = ?',
    [seatId, now + SEAT_COOLDOWN, playerId]);
  
  res.json({ success: true, seatId });
});

// Leave current seat
router.post('/leave', (req, res) => {
  const { playerId } = req.body;
  
  const player = db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  
  if (!player.currentSeat) {
    return res.status(400).json({ error: '当前未在座位上' });
  }
  
  const now = Math.floor(Date.now() / 1000);
  if (player.seatCooldown > now) {
    const remaining = player.seatCooldown - now;
    return res.status(400).json({ error: `换座冷却中，剩余 ${remaining} 秒`, cooldown: remaining });
  }
  
  db.run('UPDATE seats SET playerId = NULL WHERE seatId = ?', [player.currentSeat]);
  db.run('UPDATE players SET currentSeat = NULL, seatCooldown = ? WHERE id = ?',
    [now + SEAT_COOLDOWN, playerId]);
  
  res.json({ success: true });
});

module.exports = router;
