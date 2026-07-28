const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String },
  symbol: { type: String },
  manifestoSummary: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
