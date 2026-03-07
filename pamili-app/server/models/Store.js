const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { lat: Number, lng: Number },
  address: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  crowdLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  peakHours: [String],
  offPeakHours: [String],
  image: { type: String, default: '' },
  lastCrowdLevel: { type: String, enum: ['low', 'medium', 'high'] },
  lastCrowdTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
