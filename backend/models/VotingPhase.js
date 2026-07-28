const mongoose = require('mongoose');

const votingPhaseSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  startTime: { type: String, default: '08:00' }, // HH:MM 24h
  endTime: { type: String, default: '17:00' },
  resultsPublished: { type: Boolean, default: false },
  resultsPublishedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('VotingPhase', votingPhaseSchema);
