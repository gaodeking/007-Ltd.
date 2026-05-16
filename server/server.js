const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

async function start() {
  const db = require('./models/db');
  await db.initDB();

  // Routes
  const playerRoutes = require('./routes/player');
  const seatRoutes = require('./routes/seats');
  const gachaRoutes = require('./routes/gacha');
  const taskRoutes = require('./routes/tasks');
  const bugRoutes = require('./routes/bugs');
  const announcementRoutes = require('./routes/announcements');
  const versionRoutes = require('./routes/version');
  const broadcastRoutes = require('./routes/broadcast');

  app.use('/api/player', playerRoutes);
  app.use('/api/seats', seatRoutes);
  app.use('/api/gacha', gachaRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/bugs', bugRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/version', versionRoutes);
  app.use('/api/broadcast', broadcastRoutes);

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚜️ 加班007 服务器运行中`);
    console.log(`   本地访问: http://localhost:${PORT}`);
    if (process.env.RENDER_EXTERNAL_HOSTNAME) {
      console.log(`   公网访问: https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
    }
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
