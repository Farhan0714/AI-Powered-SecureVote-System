const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const ApprovedUser = require('../models/ApprovedUser');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const VotingPhase = require('../models/VotingPhase');
const { protect } = require('../middleware/auth');
const { isFaceMatch } = require('../utils/faceMatch');
const blockchain = require('../utils/blockchain');

async function isVotingActive() {
  const phase = await VotingPhase.findOne();
  if (!phase || !phase.isActive) return false;
  const now = new Date();
  const [sh, sm] = phase.startTime.split(':').map(Number);
  const [eh, em] = phase.endTime.split(':').map(Number);
  const start = new Date(now); start.setHours(sh, sm, 0, 0);
  const end = new Date(now); end.setHours(eh, em, 0, 0);
  return now >= start && now <= end;
}

router.get('/candidates', protect, async (req, res) => {
  const candidates = await Candidate.find();
  res.json({ success: true, candidates });
});

// Status also surfaces the voter's unique code (only to themselves) so it's visible on their dashboard.
router.get('/status', protect, async (req, res) => {
  const approvedUser = await ApprovedUser.findOne({ account: req.user._id });
  const votingActive = await isVotingActive();
  const photoBase64 = approvedUser?.livePhoto?.data ? `data:${approvedUser.livePhoto.contentType};base64,${approvedUser.livePhoto.data.toString('base64')}` : null;
  res.json({
    success: true,
    votingActive,
    isApprovedVoter: !!approvedUser,
    hasVoted: approvedUser?.hasVoted || false,
    uniqueCode: approvedUser ? approvedUser.uniqueCode : null,
    faceDescriptor: approvedUser ? approvedUser.faceDescriptor : null,
    livePhoto: photoBase64
  });
});

// Casts a vote. Requires: candidate selection, the voter's unique code, and a live face
// descriptor (extracted client-side via face-api.js) that must match the descriptor captured
// at registration time. A snapshot of the live face is stored for audit purposes.
router.post('/cast', protect, async (req, res) => {
  try {
    const { candidateId, uniqueCode, faceDescriptor, faceImage, livenessVerified } = req.body;

    if (!candidateId || !uniqueCode || !faceDescriptor) {
      return res.status(400).json({ success: false, message: 'Candidate, unique code and face verification are all required.' });
    }
    if (livenessVerified !== true) {
      return res.status(400).json({ success: false, message: 'Liveness check (head-turn) was not confirmed. Please retake your face scan.' });
    }

    const approvedUser = await ApprovedUser.findOne({ account: req.user._id });
    if (!approvedUser) return res.status(403).json({ success: false, message: 'You are not an approved voter.' });
    if (approvedUser.hasVoted) return res.status(400).json({ success: false, message: 'You have already voted.' });
    if (!(await isVotingActive())) return res.status(403).json({ success: false, message: 'Voting is not currently active.' });

    if (uniqueCode.trim().toUpperCase() !== approvedUser.uniqueCode) {
      return res.status(400).json({ success: false, message: 'Incorrect unique code.' });
    }

    let liveDescriptor;
    try {
      liveDescriptor = Array.isArray(faceDescriptor) ? faceDescriptor : JSON.parse(faceDescriptor);
      if (!Array.isArray(liveDescriptor) || liveDescriptor.length !== 128) throw new Error('bad shape');
    } catch {
      return res.status(400).json({ success: false, message: 'Face capture failed. Please retake your face scan.' });
    }

    const { isMatch, distance } = isFaceMatch(approvedUser.faceDescriptor, liveDescriptor);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Face verification failed. This does not match your registered face.' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found.' });

    const voteHash = crypto.createHash('sha256')
      .update(`${approvedUser._id}${candidate._id}${Date.now()}${Math.random()}`)
      .digest('hex');

    let faceCaptureAtVote;
    if (faceImage && faceImage.startsWith('data:')) {
      const [meta, base64Data] = faceImage.split(',');
      const contentType = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      faceCaptureAtVote = { data: Buffer.from(base64Data, 'base64'), contentType };
    }

    await Vote.create({
      user: approvedUser._id,
      candidate: candidate._id,
      faceCaptureAtVote,
      faceMatchDistance: distance,
      livenessVerified: true,
      voteHash
    });

    approvedUser.hasVoted = true;
    await approvedUser.save();

    // Anonymized transaction only - no candidate name/identity so the running tally can't be
    // inferred from the chain by anyone, including the admin.
    blockchain.addPendingVote({ voteHash });
    await blockchain.autoProposeAndAdminSign();

    res.json({ success: true, message: 'Vote cast successfully! Thank you for participating.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
