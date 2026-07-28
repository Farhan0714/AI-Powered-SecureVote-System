const mongoose = require('mongoose');

// Year-wise sector growth indicators used by the AI growth-evaluation module
const sectorDataSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  state: { type: String, required: true, default: 'All India' },
  sector: { type: String, required: true }, // 'Health','Education','GDP','Infrastructure','Employment'
  indicatorName: { type: String, required: true }, // e.g. 'GDP Growth Rate (%)', 'Literacy Rate (%)'
  value: { type: Number, required: true },
  unit: { type: String, default: '%' },
  rulingParty: { type: String }
}, { timestamps: true });

sectorDataSchema.index({ year: 1, state: 1, sector: 1 });

module.exports = mongoose.model('SectorData', sectorDataSchema);
