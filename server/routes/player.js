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

    res.json({ playerId, player });
  } catch (err) {
    console.error('Error in /init:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const player = await db.get('SELECT * FROM players WHERE id = $1', [req.params.id]);
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

router.post('/:id/save', async (req, res) => {
  try {
    const { money, ticket, hair, idleRate, bonus, currentSeat, seatCooldown, totalIdleTime, totalMoneyEarned, totalGachaCount } = req.body;

    await db.run(`
      UPDATE players SET
        money = $1, ticket = $2, hair = $3, idleRate = $4, bonus = $5,
        currentSeat = $6, seatCooldown = $7, totalIdleTime = $8,
        totalMoneyEarned = $9, totalGachaCount = $10, lastSave = EXTRACT(EPOCH FROM NOW())::INTEGER
      WHERE id = $11
    `, [money, ticket, hair, idleRate, bonus, currentSeat, seatCooldown, totalIdleTime, totalMoneyEarned, totalGachaCount, req.params.id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/offline-earnings', async (req, res) => {
  try {
    const player = await db.get('SELECT * FROM players WHERE id = $1', [req.params.id]);
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
    const player = await db.get('SELECT * FROM players WHERE id = $1', [req.params.id]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const now = Math.floor(Date.now() / 1000);
    const offlineSeconds = now - player.lastSave;
    const maxOfflineSeconds = 8 * 3600;
    const effectiveSeconds = Math.min(offlineSeconds, maxOfflineSeconds);
    const earnings = Math.floor(effectiveSeconds * player.idleRate * player.bonus);

    if (earnings > 0) {
      await db.run('UPDATE players SET money = money + $1, totalMoneyEarned = totalMoneyEarned + $1, lastSave = $2 WHERE id = $3',
        [earnings, now, req.params.id]);
    }

    res.json({ earnings, newMoney: player.money + earnings });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
