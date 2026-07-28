const mongoose = require('mongoose');

// A locked-in snapshot of results, written once by the admin's "Publish Results" action.
// Deliberately never read by any admin-facing route — only by the public/user results route —
// so that vote counts stay hidden from the admin, per project requirements.
const electionResultSchema = new mongoose.Schema({
  publishedAt: { type: Date, default: Date.now },
  totalVotes: { type: Number, required: true },
  totalApprovedVoters: { type: Number, required: true },
  turnoutPercent: { type: Number, required: true },
  results: [{
    candidateId: mongoose.Schema.Types.ObjectId,
    name: String,
    party: String,
    count: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('ElectionResult', electionResultSchema);
