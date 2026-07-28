const mongoose = require('mongoose');

// A public, append-only record of privileged actions (approvals, phase changes, block
// signing, result publishing). Deliberately stores no vote/candidate data - only
// "who did what, when" - so it can be shown publicly without compromising ballot secrecy.
const auditLogSchema = new mongoose.Schema({
  actorUsername: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String },
  targetId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
