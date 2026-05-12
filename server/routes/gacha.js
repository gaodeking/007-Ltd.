const express = require('express');
const router = express.Router();
const db = require('../models/db');
const gachaConfig = require('../config/gacha.json');

// Get gacha pool info
router.get('/pool', (req, res) => {
  res.json(gachaConfig.pools.normal);
});

// Perform gacha pull
router.post('/pull', (req, res) => {
  const { playerId } = req.body;
  
  const player = db.get('SELECT * FROM players WHERE id = ?', [playerId]);
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
  
  db.run('UPDATE players SET money = money - ?, totalGachaCount = totalGachaCount + 1 WHERE id = ?',
    [cost, playerId]);
  
  const existing = db.get('SELECT * FROM inventory WHERE playerId = ? AND itemId = ?', [playerId, selectedItem.id]);
  
  let isDuplicate = false;
  let conversion = null;
  
  if (existing) {
    isDuplicate = true;
    conversion = gachaConfig.duplicateConversion[selectedItem.rarity];
    db.run('UPDATE inventory SET quantity = quantity + 1 WHERE playerId = ? AND itemId = ?',
      [playerId, selectedItem.id]);
    db.run('UPDATE players SET hair = hair + ? WHERE id = ?',
      [conversion.hair, playerId]);
  } else {
    db.run('INSERT INTO inventory (playerId, itemId, quantity) VALUES (?, ?, 1)',
      [playerId, selectedItem.id]);
    
    if (selectedItem.bonus > 0) {
      db.run('UPDATE players SET bonus = bonus + ? WHERE id = ?',
        [selectedItem.bonus, playerId]);
    }
  }
  
  db.run('INSERT INTO gacha_log (playerId, itemId, rarity) VALUES (?, ?, ?)',
    [playerId, selectedItem.id, selectedItem.rarity]);
  
  res.json({
    item: selectedItem,
    isDuplicate,
    conversion,
    color: gachaConfig.rarityColors[selectedItem.rarity]
  });
});

// Get player inventory
router.get('/inventory/:playerId', (req, res) => {
  const inventory = db.all(`
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
    WHERE i.playerId = ?
  `, [req.params.playerId]);
  res.json(inventory);
});

module.exports = router;
