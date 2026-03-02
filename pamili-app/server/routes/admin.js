const express        = require('express');
const router         = express.Router();
const jwt            = require('jsonwebtoken');
const Admin          = require('../models/Admin');
const Product        = require('../models/Product');
const PendingProduct = require('../models/PendingProduct');
const Review         = require('../models/Review');
const Store          = require('../models/Store');
const auth           = require('../middleware/auth');

// ─── POST /api/admin/login ─────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, error: 'Username and password required' });

    const admin = await Admin.findOne({ username });
    if (!admin)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const match = await admin.comparePassword(password);
    if (!match)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ success: true, data: { token } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Pending Products ─────────────────────────────────

// GET /api/admin/products/pending
router.get('/products/pending', auth, async (req, res) => {
  try {
    const pending = await PendingProduct.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, data: pending });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/products/:id/approve
router.patch('/products/:id/approve', auth, async (req, res) => {
  try {
    const pending = await PendingProduct.findByIdAndUpdate(
      req.params.id, { status: 'approved' }, { new: true }
    );
    if (!pending) return res.status(404).json({ success: false, error: 'Not found' });

    // Add price to the actual Product collection (or create it if new)
    const today = new Date().toISOString().split('T')[0];
    let product = await Product.findOne({ name: pending.name });

    if (product) {
      // Update existing product price for this store
      const existingPrice = product.prices.find(
        (p) => p.storeId.toString() === pending.storeId.toString()
      );
      if (existingPrice) {
        // Archive old price to history
        product.priceHistory.push({ date: today, price: existingPrice.price });
        existingPrice.price       = pending.price;
        existingPrice.lastUpdated = today;
        existingPrice.inStock     = true;
      } else {
        product.prices.push({
          storeId:     pending.storeId,
          storeName:   pending.storeName,
          price:       pending.price,
          lastUpdated: today,
          inStock:     true,
        });
      }
    } else {
      // Create new product
      product = new Product({
        name:     pending.name,
        category: pending.category,
        image:    pending.image || '',
        prices:   [{
          storeId:     pending.storeId,
          storeName:   pending.storeName,
          price:       pending.price,
          lastUpdated: today,
          inStock:     true,
        }],
      });
    }

    await product.save();
    res.json({ success: true, data: pending, message: 'Approved and added to products' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/products/:id/reject
router.patch('/products/:id/reject', auth, async (req, res) => {
  try {
    const pending = await PendingProduct.findByIdAndUpdate(
      req.params.id, { status: 'rejected' }, { new: true }
    );
    if (!pending) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: pending });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Pending Reviews ──────────────────────────────────

// GET /api/admin/reviews/pending
router.get('/reviews/pending', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/reviews/:id/approve
router.patch('/reviews/:id/approve', auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id, { status: 'approved' }, { new: true }
    );
    if (!review) return res.status(404).json({ success: false, error: 'Not found' });

    // Recalculate store rating from all approved reviews
    const allReviews = await Review.find({ storeId: review.storeId, status: 'approved' });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Store.findByIdAndUpdate(review.storeId, {
      rating:      Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/reviews/:id/reject
router.patch('/reviews/:id/reject', auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id, { status: 'rejected' }, { new: true }
    );
    if (!review) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
