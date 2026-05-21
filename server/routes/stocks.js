const express = require('express');
const router = express.Router();
const db = require('../models/db');
const stockNews = require('../config/stock_news.json');

// Circuit Breaker Thresholds
const CIRCUIT_BREAKER_TRIGGER_RATIO = 0.75; // Trigger when price < 75% of center
const CIRCUIT_BREAKER_RELEASE_RATIO = 0.70; // Release when price > 70% of center
const PRICE_FLOOR_RATIO = 0.20; // Hard floor at 20% of center
const PRICE_CEILING_RATIO = 2.0; // Hard ceiling at 200% of center
const NEWS_THRESHOLD = 0.15; // 15% change triggers news
const NEWS_COOLDOWN = 180; // 3 minutes cooldown
const MAX_HOLDING_PER_STOCK = 500; // Max 500 shares per stock per player

// Lazy Price Update Function
async function updateStockPrice(client, stock) {
  const now = Math.floor(Date.now() / 1000);
  const lastUpdate = stock.updated_at ? Math.floor(new Date(stock.updated_at).getTime() / 1000) : now;
  const elapsed = now - lastUpdate;
  
  // Update every 10 seconds
  if (elapsed < 10) return stock;

  let currentPrice = stock.current_price;
  const centerPrice = stock.center_price;
  const volatility = stock.volatility;
  const reversionSpeed = stock.reversion_speed;
  let isCircuitBreaker = stock.is_circuit_breaker;

  // Calculate Mean Reversion Force
  const reversionForce = reversionSpeed * (centerPrice - currentPrice);
  
  // Calculate Random Noise (Normal distribution approximation)
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  
  // Asymmetric Volatility: Upside halved, Downside doubled
  const effectiveVol = z > 0 ? volatility * 0.5 : volatility * 2.0;
  const noise = z * effectiveVol * currentPrice;

  // Circuit Breaker Logic
  if (!isCircuitBreaker && currentPrice < centerPrice * CIRCUIT_BREAKER_TRIGGER_RATIO) {
    isCircuitBreaker = true;
  } else if (isCircuitBreaker && currentPrice > centerPrice * CIRCUIT_BREAKER_RELEASE_RATIO) {
    isCircuitBreaker = false;
  }

  // Apply Noise (Halved if circuit breaker is active)
  const effectiveNoise = isCircuitBreaker ? noise * 0.5 : noise;
  
  // New Price Calculation
  let newPrice = Math.floor(currentPrice + reversionForce + effectiveNoise);
  
  // Hard Floor
  const floorPrice = Math.floor(centerPrice * PRICE_FLOOR_RATIO);
  newPrice = Math.max(floorPrice, newPrice);
  
  // Price Ceiling (2x Center Price)
  const ceilingPrice = Math.floor(centerPrice * PRICE_CEILING_RATIO);
  newPrice = Math.min(ceilingPrice, newPrice);

  // Check for News Trigger
  const changePercent = Math.abs((newPrice - currentPrice) / currentPrice);
  if (changePercent >= NEWS_THRESHOLD) {
    const lastNewsTime = stock.last_news_at ? new Date(stock.last_news_at).getTime() / 1000 : 0;
    if (now - lastNewsTime > NEWS_COOLDOWN) {
      const direction = newPrice > currentPrice ? 'up' : 'down';
      const newsTemplate = stockNews[stock.id]?.[direction];
      if (newsTemplate) {
        await client.query(
          'INSERT INTO broadcast_messages (content, rarity) VALUES ($1, $2)',
          [`📈 股市快讯：${newsTemplate}`, 'n']
        );
        await client.query('UPDATE stocks SET last_news_at = NOW() WHERE id = $1', [stock.id]);
      }
    }
  }

  // Update Database
  await client.query(
    'UPDATE stocks SET current_price = $1, is_circuit_breaker = $2, updated_at = NOW() WHERE id = $3',
    [newPrice, isCircuitBreaker, stock.id]
  );

  // Record History
  await client.query(
    'INSERT INTO stock_history (stock_id, price, timestamp) VALUES ($1, $2, $3)',
    [stock.id, newPrice, now]
  );

  // Clean old history (keep last 20 points)
  await client.query(
    'DELETE FROM stock_history WHERE stock_id = $1 AND id NOT IN (SELECT id FROM stock_history WHERE stock_id = $1 ORDER BY timestamp DESC LIMIT 20)',
    [stock.id]
  );

  return { ...stock, current_price: newPrice, is_circuit_breaker: isCircuitBreaker };
}

// GET /api/stocks - Get all stocks with history and player holdings
router.get('/', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const playerId = req.headers['x-player-id'];
    
    // Get stocks
    const stocksRes = await client.query('SELECT * FROM stocks ORDER BY id');
    const stocks = stocksRes.rows;
    
    // Update prices and get history
    const updatedStocks = [];
    for (const stock of stocks) {
      const updated = await updateStockPrice(client, stock);
      const historyRes = await client.query(
        'SELECT price, timestamp FROM stock_history WHERE stock_id = $1 ORDER BY timestamp ASC',
        [stock.id]
      );
      updatedStocks.push({
        ...updated,
        history: historyRes.rows
      });
    }

    // Get player holdings
    let holdings = [];
    if (playerId) {
      const holdingsRes = await client.query(
        'SELECT stock_id, quantity, avg_cost FROM player_stocks WHERE playerId = $1',
        [playerId]
      );
      holdings = holdingsRes.rows;
    }

    res.json({ stocks: updatedStocks, holdings });
  } catch (err) {
    console.error('Stocks GET error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/stocks/buy - Buy stock
router.post('/buy', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { playerId, stockId, quantity } = req.body;
    
    await client.query('BEGIN');
    
    // Lock player and stock
    const playerRes = await client.query('SELECT money FROM players WHERE id = $1 FOR UPDATE', [playerId]);
    const stockRes = await client.query('SELECT * FROM stocks WHERE id = $1 FOR UPDATE', [stockId]);
    
    const player = playerRes.rows[0];
    const stock = stockRes.rows[0];
    
    if (!player || !stock) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Player or stock not found' });
    }
    
    if (stock.is_circuit_breaker) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '熔断中，暂停买入' });
    }
    
    // Price Ceiling Check: Prevent buying at absolute peak
    if (stock.current_price >= Math.floor(stock.center_price * PRICE_CEILING_RATIO)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '股价已触顶，请稍后买入' });
    }
    
    // Position Limit Check: Max 500 shares per stock
    const existingRes = await client.query(
      'SELECT quantity FROM player_stocks WHERE playerId = $1 AND stock_id = $2',
      [playerId, stockId]
    );
    const currentQty = existingRes.rows[0]?.quantity || 0;
    if (currentQty + quantity > MAX_HOLDING_PER_STOCK) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `单只股票持仓上限 ${MAX_HOLDING_PER_STOCK} 股` });
    }
    
    const cost = stock.current_price * quantity;
    if (player.money < cost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '金币不足' });
    }
    
    // Update player money
    await client.query('UPDATE players SET money = money - $1 WHERE id = $2', [cost, playerId]);
    
    // Update or insert holding
    const existingRes = await client.query(
      'SELECT quantity, avg_cost FROM player_stocks WHERE playerId = $1 AND stock_id = $2',
      [playerId, stockId]
    );
    
    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      const totalCost = (existing.avg_cost * existing.quantity) + cost;
      const newQuantity = existing.quantity + quantity;
      const newAvgCost = Math.floor(totalCost / newQuantity);
      
      await client.query(
        'UPDATE player_stocks SET quantity = $1, avg_cost = $2 WHERE playerId = $3 AND stock_id = $4',
        [newQuantity, newAvgCost, playerId, stockId]
      );
    } else {
      await client.query(
        'INSERT INTO player_stocks (playerId, stock_id, quantity, avg_cost) VALUES ($1, $2, $3, $4)',
        [playerId, stockId, quantity, stock.current_price]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true, newQuantity: (existingRes.rows[0]?.quantity || 0) + quantity });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Stock buy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/stocks/sell - Sell stock
router.post('/sell', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { playerId, stockId, quantity } = req.body;
    
    await client.query('BEGIN');
    
    // Lock holding
    const holdingRes = await client.query(
      'SELECT quantity, avg_cost FROM player_stocks WHERE playerId = $1 AND stock_id = $2 FOR UPDATE',
      [playerId, stockId]
    );
    
    if (holdingRes.rows.length === 0 || holdingRes.rows[0].quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '持仓不足' });
    }
    
    const holding = holdingRes.rows[0];
    const stockRes = await client.query('SELECT current_price FROM stocks WHERE id = $1', [stockId]);
    const stock = stockRes.rows[0];
    
    const sellValue = stock.current_price * quantity;
    const costBasis = holding.avg_cost * quantity;
    const profit = sellValue - costBasis;
    
    // Tiered Profit Tax: 2% (<10k), 5% (10k-100k), 10% (>100k)
    let taxRate = 0.02;
    if (profit > 100000) {
      taxRate = 0.10;
    } else if (profit >= 10000) {
      taxRate = 0.05;
    }
    const tax = profit > 0 ? Math.floor(profit * taxRate) : 0;
    const netProceeds = sellValue - tax;
    
    // Update player money
    await client.query('UPDATE players SET money = money + $1 WHERE id = $2', [netProceeds, playerId]);
    
    // Update holding
    const newQuantity = holding.quantity - quantity;
    if (newQuantity === 0) {
      await client.query('DELETE FROM player_stocks WHERE playerId = $1 AND stock_id = $2', [playerId, stockId]);
    } else {
      await client.query('UPDATE player_stocks SET quantity = $1 WHERE playerId = $2 AND stock_id = $3', [newQuantity, playerId, stockId]);
    }
    
    await client.query('COMMIT');
    res.json({ success: true, netProceeds, tax });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Stock sell error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
