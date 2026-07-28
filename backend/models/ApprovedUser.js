const mongoose = require('mongoose');

const approvedUserSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: Number, required: true },
  voterId: { type: String, required: true, unique: true },
  // 6-character alphanumeric code (e.g. "A3F9K2"), given to the voter at approval time.
  // Required, together with a live face match, to cast a vote.
  uniqueCode: { type: String, required: true, unique: true },
  livePhoto: { data: Buffer, contentType: String },
  faceDescriptor: { type: [Number], required: true },
  hasVoted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ApprovedUser', approvedUserSchema);
