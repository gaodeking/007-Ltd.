const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'data', 'jiaban007.db');

let db;

async function initDB() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT '无名冒险者',
      money INTEGER DEFAULT 0,
      ticket INTEGER DEFAULT 0,
      hair INTEGER DEFAULT 0,
      idleRate INTEGER DEFAULT 10,
      bonus REAL DEFAULT 1.0,
      currentSeat INTEGER DEFAULT NULL,
      seatCooldown INTEGER DEFAULT 0,
      totalIdleTime INTEGER DEFAULT 0,
      totalMoneyEarned INTEGER DEFAULT 0,
      totalGachaCount INTEGER DEFAULT 0,
      lastSave INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
      createdAt INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS seats (
      seatId INTEGER PRIMARY KEY,
      playerId TEXT DEFAULT NULL,
      bonus REAL DEFAULT 1.0,
      position TEXT DEFAULT '普通'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playerId TEXT,
      itemId TEXT,
      quantity INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gacha_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playerId TEXT,
      itemId TEXT,
      rarity TEXT,
      timestamp INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      description TEXT,
      target INTEGER,
      reward TEXT,
      type TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS player_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playerId TEXT,
      taskId INTEGER,
      progress INTEGER DEFAULT 0,
      claimed INTEGER DEFAULT 0
    )
  `);

  // Initialize 25 seats if empty
  const seatCount = db.exec('SELECT COUNT(*) as count FROM seats')[0];
  if (!seatCount || seatCount.values[0][0] === 0) {
    const positions = [
      [1, '靠窗'], [2, '靠窗'], [3, '靠窗'], [4, '靠窗'], [5, '靠窗'],
      [6, '普通'], [7, '普通'], [8, '普通'], [9, '普通'], [10, '普通'],
      [11, '普通'], [12, '普通'], [13, '普通'], [14, '普通'], [15, '普通'],
      [16, '普通'], [17, '普通'], [18, '普通'], [19, '普通'], [20, '普通'],
      [21, '角落'], [22, '角落'], [23, '角落'], [24, '角落'], [25, '角落']
    ];
    const stmt = db.prepare('INSERT INTO seats (seatId, position) VALUES (?, ?)');
    for (const [seatId, position] of positions) {
      stmt.run([seatId, position]);
    }
    stmt.free();
  }

  // Initialize daily tasks if empty for today
  const today = new Date().toISOString().split('T')[0];
  const taskResult = db.exec(`SELECT COUNT(*) as count FROM daily_tasks WHERE date = '${today}'`);
  const taskCount = taskResult[0]?.values[0][0] || 0;
  
  if (taskCount === 0) {
    const tasks = [
      [today, '连续挂机1小时', 3600, '{"ticket": 2}', 'idle_time'],
      [today, '抽奖3次', 3, '{"hair": 1}', 'gacha_count'],
      [today, '累计获得1000金币', 1000, '{"ticket": 1, "money": 200}', 'money_earned'],
      [today, '更换床位1次', 1, '{"hair": 1}', 'seat_change'],
    ];
    const stmt = db.prepare('INSERT INTO daily_tasks (date, description, target, reward, type) VALUES (?, ?, ?, ?, ?)');
    for (const task of tasks) {
      stmt.run(task);
    }
    stmt.free();
  }

  saveDB();
  console.log('✅ 数据库初始化完成');
  return db;
}

function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Helper functions
function get(query, params = []) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(query, params = []) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function run(query, params = []) {
  db.run(query, params);
  saveDB();
  return { changes: db.getRowsModified() };
}

module.exports = { initDB, get, all, run, saveDB };
