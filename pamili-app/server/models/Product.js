const mongoose = require('mongoose');

const priceEntrySchema = new mongoose.Schema({
  storeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  storeName:   { type: String, required: true },
  price:       { type: Number, required: true },
  lastUpdated: { type: String, default: () => new Date().toISOString().split('T')[0] },
  inStock:     { type: Boolean, default: true },
});

const priceHistorySchema = new mongoose.Schema({
  date:  String,
  price: Number,
});

const productSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  category:     { type: String, required: true },
  image:        { type: String, default: '' },
  prices:       [priceEntrySchema],
  priceHistory: [priceHistorySchema],
  rating:       { type: Number, default: 0 },
  reviewCount:  { type: Number, default: 0 },
}, { timestamps: true });

// Full-text search index
productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
