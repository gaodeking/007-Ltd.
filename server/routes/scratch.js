const express = require('express');
const router = express.Router();
const db = require('../models/db');

const SCRATCH_COST = 500;
const PRIZES = {
  2: 5000,  // 一等奖：3 同色
  1: 400,   // 二等奖：2 同色
  0: 0,     // 未中奖：3 异色
};
const EMOJIS = ['🐱', '🐸', '🐹'];

function generateGrid() {
  const grid = [];
  EMOJIS.forEach(emoji => {
    for (let i = 0; i < 3; i++) grid.push(emoji);
  });
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  return [grid.slice(0, 3), grid.slice(3, 6), grid.slice(6, 9)];
}

function calculateTier(revealedEmojis) {
  const counts = {};
  revealedEmojis.forEach(e => counts[e] = (counts[e] || 0) + 1);
  const maxCount = Math.max(...Object.values(counts));
  if (maxCount === 3) return 2;
  if (maxCount === 2) return 1;
  return 0;
}

router.post('/buy', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { playerId } = req.body;
    await client.query('BEGIN');
    
    const player = await client.query(
      'SELECT "id", "money", "currentScratchTicket" FROM players WHERE id = $1 FOR UPDATE',
      [playerId]
    );
    const p = player.rows[0];
    
    if (!p) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (p.currentScratchTicket) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '请先完成当前刮刮乐' });
    }
    
    if (p.money < SCRATCH_COST) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '金币不足' });
    }
    
    const grid = generateGrid();
    const revealed = Array(3).fill(null).map(() => Array(3).fill(false));
    const ticket = { grid, revealed };
    
    await client.query(
      'UPDATE players SET "money" = "money" - $1, "currentScratchTicket" = $2 WHERE id = $3',
      [SCRATCH_COST, JSON.stringify(ticket), playerId]
    );
    
    await client.query('COMMIT');
    res.json({ grid, ticketId: playerId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Scratch buy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/reveal', async (req, res) => {
  try {
    const { playerId, row, col } = req.body;
    
    const player = await db.get(
      'SELECT "currentScratchTicket" FROM players WHERE id = $1',
      [playerId]
    );
    
    if (!player || !player.currentScratchTicket) {
      return res.status(400).json({ error: 'No active ticket' });
    }
    
    const ticket = player.currentScratchTicket;
    if (ticket.revealed[row][col]) {
      return res.status(400).json({ error: 'Already revealed' });
    }
    
    ticket.revealed[row][col] = true;
    
    await db.run(
      'UPDATE players SET "currentScratchTicket" = $1 WHERE id = $2',
      [JSON.stringify(ticket), playerId]
    );
    
    res.json({ emoji: ticket.grid[row][col], revealed: ticket.revealed });
  } catch (err) {
    console.error('Scratch reveal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/claim', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { playerId } = req.body;
    await client.query('BEGIN');
    
    const player = await client.query(
      'SELECT "currentScratchTicket", "scratchEarnings" FROM players WHERE id = $1 FOR UPDATE',
      [playerId]
    );
    const p = player.rows[0];
    
    if (!p || !p.currentScratchTicket) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No active ticket' });
    }
    
    const ticket = p.currentScratchTicket;
    
    // 提取已揭开的 emoji
    const revealedEmojis = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (ticket.revealed[r][c]) {
          revealedEmojis.push(ticket.grid[r][c]);
        }
      }
    }
    
    const tier = calculateTier(revealedEmojis);
    const prize = PRIZES[tier];
    const netProfit = prize - SCRATCH_COST;
    
    // Counters for achievements
    const isTier1 = tier === 2 ? 1 : 0;
    const isTier0 = tier === 0 ? 1 : 0;
    
    await client.query(
      'UPDATE players SET "currentScratchTicket" = NULL, "scratchEarnings" = "scratchEarnings" + $1, "money" = "money" + $2, "totalScratchCount" = "totalScratchCount" + 1, "scratchTier1Count" = "scratchTier1Count" + $3, "scratchTier0Count" = "scratchTier0Count" + $4 WHERE id = $5',
      [netProfit, prize, isTier1, isTier0, playerId]
    );
    
    // Update daily task progress for scratch_count
    const today = new Date().toISOString().split('T')[0];
    await client.query(`
      INSERT INTO player_tasks ("playerId", "taskId", "progress")
      SELECT $1, dt."id", 1
      FROM daily_tasks dt
      WHERE dt."date" = $2 AND dt."type" = 'scratch_count'
      ON CONFLICT ("playerId", "taskId") DO UPDATE SET "progress" = LEAST(player_tasks."progress" + 1, dt."target")
    `, [playerId, today]);
    
    // 一等奖触发跨服播报
    if (tier === 2) {
      const nameRes = await client.query('SELECT name FROM players WHERE id = $1', [playerId]);
      const name = nameRes.rows[0]?.name || '无名冒险者';
      const content = `🎊 **${name}** 在仙人彩中刮中了 **一等奖 5000 金币**！`;
      await client.query(
        'INSERT INTO broadcast_messages (content, rarity) VALUES ($1, $2)',
        [content, 'ssr']
      );
      await client.query(`
        DELETE FROM broadcast_messages 
        WHERE id NOT IN (SELECT id FROM broadcast_messages ORDER BY created_at DESC LIMIT 50)
      `);
    }
    
    await client.query('COMMIT');
    res.json({ tier, prize, netProfit, newEarnings: (p.scratchEarnings || 0) + netProfit });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Scratch claim error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.get('/earnings', async (req, res) => {
  try {
    const playerId = req.headers['x-player-id'];
    const player = await db.get('SELECT "scratchEarnings" FROM players WHERE id = $1', [playerId]);
    res.json({ earnings: player?.scratchEarnings || 0 });
  } catch (err) {
    console.error('Scratch earnings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/current', async (req, res) => {
  try {
    const playerId = req.headers['x-player-id'];
    const player = await db.get('SELECT "currentScratchTicket" FROM players WHERE id = $1', [playerId]);
    res.json({ ticket: player?.currentScratchTicket || null });
  } catch (err) {
    console.error('Scratch current error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
