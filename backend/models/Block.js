const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  index: { type: Number, required: true, unique: true },
  prevHash: { type: String, required: true },
  txType: { type: String, required: true },
  txData: { type: mongoose.Schema.Types.Mixed, required: true },
  nonce: { type: Number, required: true },
  hash: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Block', blockSchema);
