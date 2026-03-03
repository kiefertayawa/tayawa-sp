const mongoose = require('mongoose');

const pendingProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  storeName: { type: String, required: true },
  price: { type: Number, required: true },
  submittedBy: { type: String, default: 'Anonymous Student' },
  submittedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  image: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('PendingProduct', pendingProductSchema);
