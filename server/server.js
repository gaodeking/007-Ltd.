const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database and start server
async function start() {
  const db = require('./models/db');
  await db.initDB();

  // Routes
  const playerRoutes = require('./routes/player');
  const seatRoutes = require('./routes/seats');
  const gachaRoutes = require('./routes/gacha');
  const taskRoutes = require('./routes/tasks');

  app.use('/api/player', playerRoutes);
  app.use('/api/seats', seatRoutes);
  app.use('/api/gacha', gachaRoutes);
  app.use('/api/tasks', taskRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve frontend static files
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log('⚜️ 加班007 服务器运行在 http://localhost:' + PORT);
    
    // Auto open browser (only in local development)
    if (process.env.NODE_ENV !== 'production') {
      exec('start http://localhost:' + PORT);
    }
  });
}

start();
