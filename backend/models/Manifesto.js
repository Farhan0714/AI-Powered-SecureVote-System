const mongoose = require('mongoose');

const manifestoSchema = new mongoose.Schema({
  party: { type: String, required: true, unique: true },
  year: { type: Number, required: true },
  keyPromises: [{ type: String }],
  focusSectors: [{ type: String }], // e.g. ['Health', 'Education', 'Economy']
  summary: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Manifesto', manifestoSchema);
