const express = require('express');
const router = express.Router();
const db = require('../models/db');
const gachaConfig = require('../config/gacha.json');

// Default limits fallback (Updated: SSR:1, SR:3, R:5)
const DEFAULT_LIMITS = { ssr: 1, sr: 3, r: 5 };

async function getGachaLimits() {
  try {
    const rows = await db.all('SELECT rarity, "limit" FROM gacha_limits');
    const limits = { ...DEFAULT_LIMITS };
    rows.forEach(row => {
      limits[row.rarity.toLowerCase()] = row.limit;
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
    
    // Get personal counts directly from players table for consistency and performance
    const player = await db.get('SELECT "ssrCount", "srCount", "rCount" FROM players WHERE id = $1', [playerId]);
    const countMap = {
      ssr: player?.ssrCount || 0,
      sr: player?.srCount || 0,
      r: player?.rCount || 0
    };
    
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
  const client = await db.pool.connect();
  try {
    const { playerId, count = 1 } = req.body;
    
    // Start Transaction
    await client.query('BEGIN');

    // Lock player row to prevent race conditions
    const playerRes = await client.query(
      'SELECT *, "totalGachaCount" FROM players WHERE id = $1 FOR UPDATE', 
      [playerId]
    );
    const player = playerRes.rows[0];

    if (!player) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const pool = gachaConfig.pools.normal;
    const cost = count === 10 ? pool.tenCost : pool.singleCost * count;
    
    if (player.money < cost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '金币不足' });
    }
    
    // Fetch dynamic limits
    const limits = await getGachaLimits();

    // Batch query: get all stocks
    const stocks = await client.query('SELECT "prizeId", "remaining" FROM prize_stock');
    const stockMap = {};
    stocks.rows.forEach(s => stockMap[s.prizeId] = s.remaining);
    
    // Use player counts directly (they are locked and consistent within transaction)
    const currentCounts = {
      ssr: player.ssrCount || 0,
      sr: player.srCount || 0,
      r: player.rCount || 0
    };

    const results = [];
    const stockUpdates = {};
    const rarityCounts = { ssr: 0, sr: 0, r: 0 };
    
    for (let i = 0; i < count; i++) {
      // Filter available items
      const availableItems = pool.items.filter(item => {
        if (!item.stockRef) return true; // Thanks for participating is infinite
        if (stockMap[item.stockRef] <= 0) return false; // Stock exhausted
        
        const limit = limits[item.rarity];
        // Check against locked player counts + current batch counts
        const currentCount = (currentCounts[item.rarity] || 0) + (rarityCounts[item.rarity] || 0);
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
    
    // Deduct money and update counts
    const newSsrCount = (player.ssrCount || 0) + rarityCounts.ssr;
    const newSrCount = (player.srCount || 0) + rarityCounts.sr;
    const newRCount = (player.rCount || 0) + rarityCounts.r;
    const newTotalGachaCount = (player.totalGachaCount || 0) + results.length;
    const newMoney = player.money - cost;

    await client.query(
      'UPDATE players SET "money" = $1, "totalGachaCount" = $2, "ssrCount" = $3, "srCount" = $4, "rCount" = $5 WHERE id = $6',
      [newMoney, newTotalGachaCount, newSsrCount, newSrCount, newRCount, playerId]
    );
    
    // Update stock
    for (const [prizeId, deduct] of Object.entries(stockUpdates)) {
      await client.query(
        'UPDATE prize_stock SET remaining = remaining - $1 WHERE "prizeId" = $2 AND remaining >= $1',
        [deduct, prizeId]
      );
    }
    
    // Record gacha logs
    for (const result of results) {
      await client.query(
        'INSERT INTO gacha_log ("playerId", "itemId", "rarity") VALUES ($1, $2, $3)',
        [playerId, result.item.id, result.item.rarity]
      );
    }
    
    // Broadcast gacha wins (SSR, SR, R)
    const broadcastItems = results.filter(r => ['ssr', 'sr', 'r'].includes(r.item.rarity));
    for (const result of broadcastItems) {
      let content = '';
      const rarity = result.item.rarity;
      const name = player.name || '无名冒险者';
      const itemName = result.item.name;
      
      if (rarity === 'ssr') {
        content = `🔥 **${name}** 抽中了 **SSR ${itemName}**！`;
      } else if (rarity === 'sr') {
        content = `🎉 **${name}** 抽中了 **SR ${itemName}**。`;
      } else if (rarity === 'r') {
        content = `✨ **${name}** 抽中了 **R ${itemName}**。`;
      }
      
      await client.query(
        'INSERT INTO broadcast_messages (content, rarity) VALUES ($1, $2)',
        [content, rarity]
      );
    }
    
    // Cleanup old broadcasts (keep latest 50)
    await client.query(`
      DELETE FROM broadcast_messages 
      WHERE id NOT IN (
        SELECT id FROM broadcast_messages ORDER BY created_at DESC LIMIT 50
      )
    `);
    
    // Commit Transaction
    await client.query('COMMIT');
    
    res.json({
      results,
      count: results.length
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Pull error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
