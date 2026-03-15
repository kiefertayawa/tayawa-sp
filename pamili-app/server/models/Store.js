const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { lat: Number, lng: Number },
  address: { type: String, required: true },
  operatingHours: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  peakHours: { type: String, default: '' },
  offPeakHours: { type: String, default: '' },
  image: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  lastCrowdLevel: { type: String, enum: ['low', 'medium', 'high'] },
  lastCrowdTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
