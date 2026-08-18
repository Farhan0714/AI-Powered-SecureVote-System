const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const User = require('../models/User');
const { protect, verifierOrAdmin, adminOnly } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const blockchain = require('../utils/blockchain');

router.use(protect, verifierOrAdmin);

router.post('/generate-key', async (req, res) => {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    req.user.publicKeyPem = publicKey;
    await req.user.save();
    await logAction(req.user, 'verifier_key_generated', { targetType: 'User', targetId: req.user._id });

    res.json({
      success: true,
      message: 'Signing key generated. Save your private key now - it will not be shown again.',
      publicKeyPem: publicKey,
      privateKeyPem: privateKey
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', (req, res) => {
  res.json({ success: true, hasSigningKey: !!req.user.publicKeyPem });
});

router.get('/status', (req, res) => {
  const stats = blockchain.getStats();
  res.json({ success: true, pendingVotesQueued: stats.pendingVotes, totalFinalizedBlocks: stats.totalBlocks, chainValid: stats.isValid });
});

router.get('/roster', adminOnly, async (req, res) => {
  const roster = await User.find({ role: { $in: ['admin', 'verifier'] } })
    .select('username role publicKeyPem');
  res.json({
    success: true,
    roster: roster.map(u => ({ username: u.username, role: u.role, hasKey: !!u.publicKeyPem }))
  });
});

router.post('/blocks/propose', async (req, res) => {
  try {
    const requiredSignatures = Number(req.body?.requiredSignatures) || 2;
    const pendingBlock = await blockchain.proposeBlock(requiredSignatures);
    if (!pendingBlock) return res.status(400).json({ success: false, message: 'No pending transactions to propose.' });
    await logAction(req.user, 'block_proposed', { targetType: 'PendingBlock', targetId: pendingBlock._id, metadata: { index: pendingBlock.index, requiredSignatures } });
    res.json({ success: true, message: 'Block proposed. Awaiting verifier signatures.', pendingBlockId: pendingBlock._id, index: pendingBlock.index, hash: pendingBlock.hash });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/blocks/pending', async (req, res) => {
  try {
    const pending = await blockchain.getPendingBlocks();
    res.json({
      success: true,
      pending: pending.map(b => ({
        _id: b._id,
        index: b.index,
        hash: b.hash,
        prevHash: b.prevHash,
        timestamp: b.timestamp,
        signatureCount: b.signatures.length,
        requiredSignatures: b.requiredSignatures,
        signedBy: b.signatures.map(s => s.verifierUsername),
        alreadySignedByMe: b.signatures.some(s => String(s.verifier) === String(req.user._id))
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/blocks/:id/sign', async (req, res) => {
  try {
    const { signatureBase64 } = req.body;
    if (!signatureBase64) return res.status(400).json({ success: false, message: 'Signature is required.' });

    const { pendingBlock, finalized } = await blockchain.addSignature(req.params.id, req.user, signatureBase64);
    await logAction(req.user, finalized ? 'block_finalized' : 'block_signed', {
      targetType: 'Block', targetId: pendingBlock._id,
      metadata: { index: pendingBlock.index, signatureCount: pendingBlock.signatures.length }
    });
    res.json({ success: true, message: finalized ? 'Block fully signed and finalized into the chain!' : 'Signature recorded. Awaiting more signatures.', finalized });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
