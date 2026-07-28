const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const blockchain = require('../utils/blockchain');

// Publicly-viewable (to any logged-in user, any role) transparency data.
// Both endpoints are deliberately safe to expose to everyone, including admins:
// block metadata excludes transaction contents, and the audit log excludes any
// vote/candidate-identifying data - only "who did what administrative action, when."

router.get('/chain', protect, (req, res) => {
  res.json({ success: true, chain: blockchain.getPublicChainMeta() });
});

router.get('/audit-log', protect, async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, logs });
});

module.exports = router;
