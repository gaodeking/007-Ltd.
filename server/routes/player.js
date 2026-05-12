const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

// Get or create player
router.get('/init', (req, res) => {
  let playerId = req.headers['x-player-id'];
  
  if (!playerId) {
    playerId = uuidv4();
    db.run('INSERT INTO players (id) VALUES (?)', [playerId]);
  }
  
  let player = db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  
  if (!player) {
    db.run('INSERT INTO players (id) VALUES (?)', [playerId]);
    player = db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  }
  
  res.json({ playerId, player });
});

// Get player data
router.get('/:id', (req, res) => {
  const player = db.get('SELECT * FROM players WHERE id = ?', [req.params.id]);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

// Update player name
router.put('/:id/name', (req, res) => {
  const { name } = req.body;
  if (!name || name.length > 20) {
    return res.status(400).json({ error: 'Invalid name' });
  }
  db.run('UPDATE players SET name = ? WHERE id = ?', [name, req.params.id]);
  res.json({ success: true });
});

// Save player progress
router.post('/:id/save', (req, res) => {
  const { money, ticket, hair, idleRate, bonus, currentSeat, seatCooldown, totalIdleTime, totalMoneyEarned, totalGachaCount } = req.body;
  
  db.run(`
    UPDATE players SET 
      money = ?, ticket = ?, hair = ?, idleRate = ?, bonus = ?,
      currentSeat = ?, seatCooldown = ?, totalIdleTime = ?,
      totalMoneyEarned = ?, totalGachaCount = ?, lastSave = CAST(strftime('%s', 'now') AS INTEGER)
    WHERE id = ?
  `, [money, ticket, hair, idleRate, bonus, currentSeat, seatCooldown, totalIdleTime, totalMoneyEarned, totalGachaCount, req.params.id]);
  
  res.json({ success: true });
});

// Calculate offline earnings
router.get('/:id/offline-earnings', (req, res) => {
  const player = db.get('SELECT * FROM players WHERE id = ?', [req.params.id]);
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
});

// Claim offline earnings
router.post('/:id/claim-offline', (req, res) => {
  const player = db.get('SELECT * FROM players WHERE id = ?', [req.params.id]);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  
  const now = Math.floor(Date.now() / 1000);
  const offlineSeconds = now - player.lastSave;
  const maxOfflineSeconds = 8 * 3600;
  const effectiveSeconds = Math.min(offlineSeconds, maxOfflineSeconds);
  const earnings = Math.floor(effectiveSeconds * player.idleRate * player.bonus);
  
  if (earnings > 0) {
    db.run('UPDATE players SET money = money + ?, totalMoneyEarned = totalMoneyEarned + ?, lastSave = ? WHERE id = ?',
      [earnings, earnings, now, req.params.id]);
  }
  
  res.json({ earnings, newMoney: player.money + earnings });
});

module.exports = router;
