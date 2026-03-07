const mongoose = require('mongoose');

const priceEntrySchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  storeName: { type: String, required: true },
  price: { type: Number, required: true },
  lastUpdated: { type: String, default: () => new Date().toISOString().split('T')[0] },
  inStock: { type: Boolean, default: true },
});

const priceHistorySchema = new mongoose.Schema({
  date: String,
  price: Number,
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: '' },
  prices: [priceEntrySchema],
  priceHistory: [priceHistorySchema],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedBy: { type: String, default: 'Anonymous Student' },
  submittedDate: { type: String, default: () => new Date().toISOString() },
  crowdLevel: { type: String, enum: ['low', 'medium', 'high', 'not_sure'], default: 'not_sure' },
  locationVerified: { type: Boolean, default: false },
}, { timestamps: true });

// Full-text search index
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
