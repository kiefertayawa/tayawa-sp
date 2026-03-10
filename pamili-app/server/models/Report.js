const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    storeName: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 200 },
    status: { type: String, enum: ['pending', 'resolved', 'ignored'], default: 'pending' },
    submittedDate: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
