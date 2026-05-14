const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const versionFilePath = path.join(__dirname, '..', '..', 'client', 'dist', 'version.json');

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    if (fs.existsSync(versionFilePath)) {
      const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
      res.json(versionData);
    } else {
      res.json({ version: 'dev', timestamp: Date.now() });
    }
  } catch (err) {
    res.json({ version: 'unknown', timestamp: Date.now() });
  }
});

module.exports = router;
