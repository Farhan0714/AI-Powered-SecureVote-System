const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: Number, required: true },
  voterId: { type: String, required: true },
  regEmail: { type: String, required: true, index: true },
  livePhoto: { data: Buffer, contentType: String },
  identityProof: { data: Buffer, contentType: String },
  // 128-length face descriptor extracted client-side (face-api.js) from the live photo,
  // used later to verify identity via face match during vote casting.
  faceDescriptor: { type: [Number], default: undefined },
  livenessVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  type: { type: String, enum: ['new', 'correction', 'deletion'], default: 'new' },
  reasonForDeletion: { type: String, default: '' },
  adminComment: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
