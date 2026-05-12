const express = require('express');
const router = express.Router();
const db = require('../models/db');
const gachaConfig = require('../config/gacha.json');

router.get('/pool', (req, res) => {
  res.json(gachaConfig.pools.normal);
});

router.post('/pull', async (req, res) => {
  try {
    const { playerId } = req.body;

    const player = await db.get('SELECT * FROM players WHERE id = $1', [playerId]);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const pool = gachaConfig.pools.normal;
    const cost = pool.cost.money;

    if (player.money < cost) {
      return res.status(400).json({ error: '金币不足' });
    }

    const totalWeight = pool.items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedItem = null;

    for (const item of pool.items) {
      random -= item.weight;
      if (random <= 0) {
        selectedItem = item;
        break;
      }
    }

    await db.run('UPDATE players SET money = money - $1, totalGachaCount = totalGachaCount + 1 WHERE id = $2',
      [cost, playerId]);

    const existing = await db.get('SELECT * FROM inventory WHERE playerId = $1 AND itemId = $2', [playerId, selectedItem.id]);

    let isDuplicate = false;
    let conversion = null;

    if (existing) {
      isDuplicate = true;
      conversion = gachaConfig.duplicateConversion[selectedItem.rarity];
      await db.run('UPDATE inventory SET quantity = quantity + 1 WHERE playerId = $1 AND itemId = $2',
        [playerId, selectedItem.id]);
      await db.run('UPDATE players SET hair = hair + $1 WHERE id = $2',
        [conversion.hair, playerId]);
    } else {
      await db.run('INSERT INTO inventory (playerId, itemId, quantity) VALUES ($1, $2, 1)',
        [playerId, selectedItem.id]);

      if (selectedItem.bonus > 0) {
        await db.run('UPDATE players SET bonus = bonus + $1 WHERE id = $2',
          [selectedItem.bonus, playerId]);
      }
    }

    await db.run('INSERT INTO gacha_log (playerId, itemId, rarity) VALUES ($1, $2, $3)',
      [playerId, selectedItem.id, selectedItem.rarity]);

    res.json({
      item: selectedItem,
      isDuplicate,
      conversion,
      color: gachaConfig.rarityColors[selectedItem.rarity]
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/inventory/:playerId', async (req, res) => {
  try {
    const inventory = await db.all(`
      SELECT i.*,
        CASE
          WHEN i.itemId = 'coffee_machine' THEN '☕ 咖啡机'
          WHEN i.itemId = 'ergonomic_chair' THEN '🪑 人体工学椅'
          WHEN i.itemId = 'slacking_phone' THEN '📱 摸鱼手机'
          WHEN i.itemId = 'excellent_employee' THEN '🏆 优秀员工'
          WHEN i.itemId = 'king_of_grind' THEN '👑 卷王之王'
          ELSE i.itemId
        END as displayName
      FROM inventory i
      WHERE i.playerId = $1
    `, [req.params.playerId]);
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
