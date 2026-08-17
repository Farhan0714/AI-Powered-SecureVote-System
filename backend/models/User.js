const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'verifier'], default: 'user' },
  // RSA public key (PEM) used to verify this account's block-signature contributions.
  // The matching private key is generated server-side once, returned to the account
  // holder a single time, and never stored - see routes/verifiers.js.
  publicKeyPem: { type: String, default: null },
  privateKeyPem: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
