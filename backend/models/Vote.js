const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovedUser', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  // Face image captured live at the moment of voting, kept for audit purposes.
  faceCaptureAtVote: { data: Buffer, contentType: String },
  faceMatchDistance: { type: Number }, // Euclidean distance between registration & vote-time descriptors (lower = closer match)
  livenessVerified: { type: Boolean, default: false }, // client-attested head-turn check passed (see README limitations)
  voteHash: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Vote', voteSchema);
