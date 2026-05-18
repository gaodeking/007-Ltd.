const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // 强制使用 IPv4（Render 免费实例不支持 IPv6）
  family: 4
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT DEFAULT '无名冒险者',
        avatar TEXT DEFAULT '🧙‍♂️',
        money INTEGER DEFAULT 0,
        idleRate INTEGER DEFAULT 1,
        bonus REAL DEFAULT 1.0,
        currentSeat INTEGER DEFAULT NULL,
        seatCooldown INTEGER DEFAULT 0,
        "totalidletime" INTEGER DEFAULT 0,
        "totalmoneyearned" INTEGER DEFAULT 0,
        "totalgachacount" INTEGER DEFAULT 0,
        "ssrcount" INTEGER DEFAULT 0,
        "srcount" INTEGER DEFAULT 0,
        "rcount" INTEGER DEFAULT 0,
        lastSave INTEGER DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
        createdAt INTEGER DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prize_stock (
        "prizeId" TEXT PRIMARY KEY,
        "remaining" INTEGER NOT NULL,
        "total" INTEGER NOT NULL,
        "active" BOOLEAN DEFAULT TRUE
      )
    `);

    // Initialize prize stock if empty
    const prizeStockResult = await client.query('SELECT COUNT(*) as count FROM prize_stock');
    const prizeStockCount = parseInt(prizeStockResult.rows[0].count);
    if (prizeStockCount === 0) {
      const prizes = [
        ['ff14_card', 5, 5],
        ['phone_credit', 30, 30],
        ['milk_tea', 30, 30],
        ['vita_tea', 50, 50],
        ['coca_cola', 50, 50],
      ];
      for (const [prizeId, remaining, total] of prizes) {
        await client.query('INSERT INTO prize_stock ("prizeId", "remaining", "total") VALUES ($1, $2, $3)', [prizeId, remaining, total]);
      }
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS seats (
        "seatId" INTEGER PRIMARY KEY,
        "playerId" TEXT DEFAULT NULL,
        "bonus" REAL DEFAULT 1.0,
        "position" TEXT DEFAULT '普通'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        "id" SERIAL PRIMARY KEY,
        "playerId" TEXT,
        "itemId" TEXT,
        "quantity" INTEGER DEFAULT 1
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS gacha_log (
        "id" SERIAL PRIMARY KEY,
        "playerId" TEXT,
        "itemId" TEXT,
        "rarity" TEXT,
        "timestamp" INTEGER DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_tasks (
        "id" SERIAL PRIMARY KEY,
        "date" TEXT,
        "description" TEXT,
        "target" INTEGER,
        "reward" TEXT,
        "type" TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS player_tasks (
        "id" SERIAL PRIMARY KEY,
        "playerId" TEXT,
        "taskId" INTEGER,
        "progress" INTEGER DEFAULT 0,
        "claimed" INTEGER DEFAULT 0
      )
    `);

    // Initialize 25 seats if empty
    const seatCountResult = await client.query('SELECT COUNT(*) as count FROM seats');
    const seatCount = parseInt(seatCountResult.rows[0].count);
    if (seatCount === 0) {
      const positions = [
        [1, '靠窗'], [2, '靠窗'], [3, '靠窗'], [4, '靠窗'], [5, '靠窗'],
        [6, '普通'], [7, '普通'], [8, '普通'], [9, '普通'], [10, '普通'],
        [11, '普通'], [12, '普通'], [13, '普通'], [14, '普通'], [15, '普通'],
        [16, '普通'], [17, '普通'], [18, '普通'], [19, '普通'], [20, '普通'],
        [21, '角落'], [22, '角落'], [23, '角落'], [24, '角落'], [25, '角落']
      ];
      for (const [seatId, position] of positions) {
        await client.query('INSERT INTO seats ("seatId", "position") VALUES ($1, $2)', [seatId, position]);
      }
    }

    // Initialize daily tasks if empty for today
    const today = new Date().toISOString().split('T')[0];
    const taskResult = await client.query('SELECT COUNT(*) as count FROM daily_tasks WHERE "date" = $1', [today]);
    const taskCount = parseInt(taskResult.rows[0].count);

    if (taskCount === 0) {
      const tasks = [
        [today, '连续挂机1小时', 3600, '{"money": 200}', 'idle_time'],
        [today, '抽奖3次', 3, '{"money": 100}', 'gacha_count'],
        [today, '累计获得1000金币', 1000, '{"money": 200}', 'money_earned'],
        [today, '更换床位1次', 1, '{"money": 100}', 'seat_change'],
      ];
      for (const task of tasks) {
        await client.query(
          'INSERT INTO daily_tasks ("date", "description", "target", "reward", "type") VALUES ($1, $2, $3, $4, $5)',
          task
        );
      }
    }

    console.log('✅ 数据库初始化完成');
  } finally {
    client.release();
  }
}

async function get(query, params = []) {
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

async function all(query, params = []) {
  const result = await pool.query(query, params);
  return result.rows;
}

async function run(query, params = []) {
  const result = await pool.query(query, params);
  return { changes: result.rowCount };
}

module.exports = { initDB, get, all, run, pool };
