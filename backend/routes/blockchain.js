const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const bc = require('../utils/blockchain');

// Deliberately does NOT expose raw block/transaction contents.
// Only an integrity check (valid/invalid + block count) is available, and only to admins.
// Block proposal/signing lives in routes/verifiers.js; public-safe chain metadata
// (hashes only, no tx data) lives in routes/public.js.
router.get('/verify', protect, adminOnly, (req, res) => {
  const stats = bc.getStats();
  res.json({ success: true, valid: stats.isValid, totalBlocks: stats.totalBlocks });
});

router.post('/reset', protect, adminOnly, async (req, res) => {
  await bc.resetBlockchain();
  res.json({ success: true, message: 'Blockchain reset to genesis block.' });
});

module.exports = router;
