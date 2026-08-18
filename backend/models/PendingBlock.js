const mongoose = require('mongoose');

const pendingBlockSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  prevHash: { type: String, required: true },
  txType: { type: String, required: true },
  txData: { type: mongoose.Schema.Types.Mixed, required: true },
  nonce: { type: Number, required: true },
  hash: { type: String, required: true },
  timestamp: { type: String, required: true },
  requiredSignatures: { type: Number, default: 2 },
  signatures: [{
    verifier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    verifierUsername: String,
    signatureBase64: { type: String, required: true },
    signedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['pending_signatures', 'finalized'], default: 'pending_signatures' }
}, { timestamps: true });

module.exports = mongoose.model('PendingBlock', pendingBlockSchema);
