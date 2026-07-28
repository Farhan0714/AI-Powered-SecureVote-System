const express = require('express');
const router = express.Router();

const Registration = require('../models/Registration');
const ApprovedUser = require('../models/ApprovedUser');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const VotingPhase = require('../models/VotingPhase');
const ElectionResult = require('../models/ElectionResult');
const { protect, adminOnly } = require('../middleware/auth');
const { sendApprovalEmail } = require('../utils/email');
const { logAction } = require('../utils/audit');
const blockchain = require('../utils/blockchain');

router.use(protect, adminOnly);

// Generates a 6-character alphanumeric code, avoiding ambiguous characters (0/O, 1/I).
function generateUniqueCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function generateUnusedCode() {
  let code, exists = true;
  while (exists) {
    code = generateUniqueCode();
    exists = await ApprovedUser.exists({ uniqueCode: code });
  }
  return code;
}

// List all registrations (optionally filter by status)
router.get('/registrations', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const registrations = await Registration.find(filter)
      .select('-livePhoto -identityProof -faceDescriptor')
      .populate('account', 'username email')
      .sort({ createdAt: -1 });
    res.json({ success: true, registrations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// View single registration including images (base64) - face descriptor withheld (not needed for manual review)
router.get('/registrations/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('account', 'username email');
    if (!registration) return res.status(404).json({ success: false, message: 'Not found.' });

    const toBase64 = (img) => img?.data ? `data:${img.contentType};base64,${img.data.toString('base64')}` : null;
    const obj = registration.toObject();
    delete obj.faceDescriptor;
    res.json({
      success: true,
      registration: {
        ...obj,
        livePhoto: toBase64(registration.livePhoto),
        identityProof: toBase64(registration.identityProof)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve / reject a registration
router.post('/registrations/:id/decision', async (req, res) => {
  try {
    const { decision, comment } = req.body; // decision: 'approved' | 'rejected'
    const registration = await Registration.findById(req.params.id).populate('account', 'username email');
    if (!registration) return res.status(404).json({ success: false, message: 'Not found.' });
    if (registration.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Registration already processed.' });
    }

    registration.status = decision;
    registration.adminComment = comment || '';
    await registration.save();

    if (decision === 'approved') {
      const uniqueCode = await generateUnusedCode();
      await ApprovedUser.create({
        account: registration.account._id,
        name: registration.name,
        fatherName: registration.fatherName,
        motherName: registration.motherName,
        address: registration.address,
        phone: registration.phone,
        age: registration.age,
        voterId: registration.voterId,
        uniqueCode,
        faceDescriptor: registration.faceDescriptor,
        livePhoto: registration.livePhoto
      });

      // Anonymized event only - no personal identifiers written to the chain. It's queued;
      // it only becomes part of the trusted chain once a quorum of verifiers sign it
      // (see routes/verifiers.js) - nothing is auto-finalized here.
      blockchain.addPendingVote({ event: 'voter_approved' });
      await sendApprovalEmail(registration.account.email, registration.account.username, uniqueCode);
    }

    await logAction(req.user, decision === 'approved' ? 'registration_approved' : 'registration_rejected', {
      targetType: 'Registration', targetId: registration._id, metadata: { voterId: registration.voterId }
    });

    res.json({ success: true, message: `Registration ${decision}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Results: publish-only. Admin NEVER gets to read vote counts through this API. ----
router.get('/results/status', async (req, res) => {
  const phase = await VotingPhase.findOne();
  res.json({
    success: true,
    votingActive: phase?.isActive ?? true,
    resultsPublished: phase?.resultsPublished ?? false,
    resultsPublishedAt: phase?.resultsPublishedAt ?? null
  });
});

router.post('/results/publish', async (req, res) => {
  try {
    const phase = await VotingPhase.findOne();
    if (!phase) return res.status(400).json({ success: false, message: 'Voting phase not configured.' });
    if (phase.isActive) {
      return res.status(400).json({ success: false, message: 'Turn voting OFF (end the voting phase) before publishing results.' });
    }
    if (phase.resultsPublished) {
      return res.status(400).json({ success: false, message: 'Results have already been published.' });
    }

    const tally = await Vote.aggregate([
      { $group: { _id: '$candidate', count: { $sum: 1 } } },
      { $lookup: { from: 'candidates', localField: '_id', foreignField: '_id', as: 'candidate' } },
      { $unwind: '$candidate' },
      { $project: { _id: 0, candidateId: '$candidate._id', name: '$candidate.name', party: '$candidate.party', count: 1 } },
      { $sort: { count: -1 } }
    ]);
    const totalVotes = tally.reduce((s, r) => s + r.count, 0);
    const totalApprovedVoters = await ApprovedUser.countDocuments();

    await ElectionResult.create({
      totalVotes,
      totalApprovedVoters,
      turnoutPercent: totalApprovedVoters ? Number(((totalVotes / totalApprovedVoters) * 100).toFixed(2)) : 0,
      results: tally
    });

    phase.resultsPublished = true;
    phase.resultsPublishedAt = new Date();
    await phase.save();

    // Note: this does NOT auto-finalize any remaining pending block - that still requires
    // an explicit propose + multi-signature step via /api/verifiers/blocks/*.
    // No vote-count metadata is logged here - only that publishing occurred.
    await logAction(req.user, 'results_published', { targetType: 'ElectionResult' });

    // Deliberately do NOT return `tally`/counts in this response - admin publishes blind.
    res.json({ success: true, message: 'Results published. Voters can now view the results on their dashboard.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Blockchain: integrity verification only - no chain/transaction contents exposed. ----
router.get('/blockchain/verify', async (req, res) => {
  try {
    const stats = blockchain.getStats();
    res.json({ success: true, valid: stats.isValid, totalBlocks: stats.totalBlocks, pendingVotesQueued: stats.pendingVotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Voting phase control
router.get('/voting-phase', async (req, res) => {
  let phase = await VotingPhase.findOne();
  if (!phase) phase = await VotingPhase.create({});
  res.json({ success: true, phase });
});

router.put('/voting-phase', async (req, res) => {
  try {
    const { isActive, startTime, endTime } = req.body;
    let phase = await VotingPhase.findOne();
    if (!phase) phase = new VotingPhase();
    if (isActive !== undefined) phase.isActive = isActive;
    if (startTime) phase.startTime = startTime;
    if (endTime) phase.endTime = endTime;
    await phase.save();
    await logAction(req.user, 'voting_phase_updated', { targetType: 'VotingPhase', metadata: { isActive: phase.isActive, startTime: phase.startTime, endTime: phase.endTime } });
    res.json({ success: true, message: 'Voting phase updated.', phase });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Candidate management
router.post('/candidates', async (req, res) => {
  const { name, party, symbol, manifestoSummary } = req.body;
  const candidate = await Candidate.create({ name, party, symbol, manifestoSummary });
  await logAction(req.user, 'candidate_added', { targetType: 'Candidate', targetId: candidate._id, metadata: { name, party } });
  res.status(201).json({ success: true, candidate });
});

router.delete('/candidates/:id', async (req, res) => {
  await Candidate.findByIdAndDelete(req.params.id);
  await logAction(req.user, 'candidate_removed', { targetType: 'Candidate', targetId: req.params.id });
  res.json({ success: true, message: 'Candidate removed.' });
});

module.exports = router;
