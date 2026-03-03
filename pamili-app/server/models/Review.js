const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  userName: { type: String, default: 'Anonymous User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true },
  images: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  date: { type: String, default: () => new Date().toLocaleDateString() },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
