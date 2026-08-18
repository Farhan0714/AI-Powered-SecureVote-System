const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const bc = require('../utils/blockchain');

router.get('/verify', protect, adminOnly, (req, res) => {
  const stats = bc.getStats();
  res.json({ success: true, valid: stats.isValid, totalBlocks: stats.totalBlocks });
});

router.post('/reset', protect, adminOnly, async (req, res) => {
  await bc.resetBlockchain();
  res.json({ success: true, message: 'Blockchain reset to genesis block.' });
});

module.exports = router;
