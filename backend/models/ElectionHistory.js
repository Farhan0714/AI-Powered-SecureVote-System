const mongoose = require('mongoose');

// Historical election results - used for chatbot context and results dashboards
const electionHistorySchema = new mongoose.Schema({
  year: { type: Number, required: true },
  electionType: { type: String, enum: ['general', 'state'], default: 'general' },
  state: { type: String, required: true }, // 'All India' for national totals
  party: { type: String, required: true },
  votesReceived: { type: Number, required: true },
  voteSharePercent: { type: Number, required: true },
  seatsWon: { type: Number, default: 0 },
  seatsContested: { type: Number, default: 0 }
}, { timestamps: true });

electionHistorySchema.index({ year: 1, state: 1, party: 1 });

module.exports = mongoose.model('ElectionHistory', electionHistorySchema);
