const express = require('express');
const router = express.Router();
const db = require('../models/db');
const gachaConfig = require('../config/gacha.json');

// Default limits fallback
const DEFAULT_LIMITS = { ssr: 1, sr: 4, r: 8 };

async function getGachaLimits() {
  try {
    const rows = await db.all('SELECT rarity, limit FROM gacha_limits');
    const limits = { ...DEFAULT_LIMITS };
    rows.forEach(row => {
      limits[row.rarity] = row.limit;
    });
    return limits;
  } catch (err) {
    console.warn('Failed to load gacha limits, using defaults:', err.message);
    return DEFAULT_LIMITS;
  }
}

router.get('/pool', async (req, res) => {
  try {
    const playerId = req.headers['x-player-id'];
    const pool = gachaConfig.pools.normal;
    const limits = await getGachaLimits();
    
    // Get stock info
    const stocks = await db.all('SELECT "prizeId", "remaining", "total" FROM prize_stock');
    const stockMap = {};
    stocks.forEach(s => stockMap[s.prizeId] = s);
    
    // Get personal counts
    const personalCounts = await db.all(
      'SELECT "rarity", COUNT(*) as count FROM gacha_log WHERE "playerId" = $1 GROUP BY "rarity"',
      [playerId]
    );
    const countMap = {};
    personalCounts.forEach(c => countMap[c.rarity] = parseInt(c.count));
    
    // Assemble response
    const itemsWithStock = pool.items.map(item => {
      const stock = item.stockRef ? stockMap[item.stockRef] : null;
      const limit = limits[item.rarity];
      const personalCount = countMap[item.rarity] || 0;
      const isExhausted = stock ? stock.remaining <= 0 : false;
      const isLimitReached = limit && personalCount >= limit;
      
      return {
        ...item,
        remaining: stock ? stock.remaining : '∞',
        total: stock ? stock.total : '∞',
        personalCount,
        personalLimit: limit || '∞',
        isExhausted,
        isLimitReached,
        isUnavailable: isExhausted || isLimitReached
      };
    });
    
    res.json({ ...pool, items: itemsWithStock });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pull', async (req, res) => {
  try {
    const { playerId, count = 1 } = req.body;
    
    const player = await db.get('SELECT "id", "name", "money", "idleRate", "bonus", "currentSeat", "seatCooldown", "totalIdleTime", "totalMoneyEarned", "totalGachaCount", "lastSave", "createdAt", "ssrCount", "srCount", "rCount" FROM players WHERE id = $1', [playerId]);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    
    const pool = gachaConfig.pools.normal;
    const cost = count === 10 ? pool.tenCost : pool.singleCost * count;
    
    if (player.money < cost) {
      return res.status(400).json({ error: '金币不足' });
    }
    
    // Fetch dynamic limits
    const limits = await getGachaLimits();

    // Batch query: get all stocks and personal counts once
    const stocks = await db.all('SELECT "prizeId", "remaining" FROM prize_stock');
    const stockMap = {};
    stocks.forEach(s => stockMap[s.prizeId] = s.remaining);
    
    const personalCounts = await db.all(
      'SELECT "rarity", COUNT(*) as count FROM gacha_log WHERE "playerId" = $1 GROUP BY "rarity"',
      [playerId]
    );
    const countMap = {};
    personalCounts.forEach(c => countMap[c.rarity] = parseInt(c.count));
    
    const results = [];
    const stockUpdates = {};
    const rarityCounts = { ssr: 0, sr: 0, r: 0 };
    
    for (let i = 0; i < count; i++) {
      // Filter available items
      const availableItems = pool.items.filter(item => {
        if (!item.stockRef) return true; // Thanks for participating is infinite
        if (stockMap[item.stockRef] <= 0) return false; // Stock exhausted
        const limit = limits[item.rarity];
        const currentCount = (countMap[item.rarity] || 0) + (rarityCounts[item.rarity] || 0);
        if (limit && currentCount >= limit) return false; // Personal limit reached
        return true;
      });
      
      if (availableItems.length === 0) break; // No items available
      
      // Weighted random
      const totalWeight = availableItems.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedItem = null;
      
      for (const item of availableItems) {
        random -= item.weight;
        if (random <= 0) {
          selectedItem = item;
          break;
        }
      }
      
      if (!selectedItem) selectedItem = availableItems[availableItems.length - 1];
      
      // Track stock updates and rarity counts
      if (selectedItem.stockRef) {
        stockUpdates[selectedItem.stockRef] = (stockUpdates[selectedItem.stockRef] || 0) + 1;
      }
      if (selectedItem.rarity !== 'n') {
        rarityCounts[selectedItem.rarity] = (rarityCounts[selectedItem.rarity] || 0) + 1;
      }
      
      results.push({
        item: selectedItem,
        color: gachaConfig.rarityColors[selectedItem.rarity]
      });
    }
    
    // Deduct money
    await db.run('UPDATE players SET "money" = "money" - $1, "totalGachaCount" = "totalGachaCount" + $2 WHERE id = $3',
      [cost, count, playerId]);
    
    // Update stock
    for (const [prizeId, deduct] of Object.entries(stockUpdates)) {
      await db.run('UPDATE prize_stock SET remaining = remaining - $1 WHERE "prizeId" = $2 AND remaining >= $1',
        [deduct, prizeId]);
    }
    
    // Update personal counts
    for (const [rarity, addCount] of Object.entries(rarityCounts)) {
      if (addCount > 0) {
        const countField = rarity === 'ssr' ? 'ssrCount' : rarity === 'sr' ? 'srCount' : 'rCount';
        await db.run(`UPDATE players SET "${countField}" = "${countField}" + $1 WHERE id = $2`,
          [addCount, playerId]);
      }
    }
    
    // Record gacha logs
    for (const result of results) {
      await db.run('INSERT INTO gacha_log ("playerId", "itemId", "rarity", "player_name") VALUES ($1, $2, $3, $4)',
        [playerId, result.item.id, result.item.rarity, player.name]);
    }
    
    res.json({
      results,
      count: results.length
    });
  } catch (err) {
    console.error('Pull error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
