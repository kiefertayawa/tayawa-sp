const express        = require('express');
const router         = express.Router();
const Product        = require('../models/Product');
const PendingProduct = require('../models/PendingProduct');
const Store          = require('../models/Store');
const upload         = require('../middleware/upload');

// GET /api/products — get all approved products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/search?q=rice — search by name or category
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ success: true, data: [] });

    const products = await Product.find({
      $or: [
        { name:     { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ],
    });

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id — get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products/submit — community submits a product price
router.post('/submit', upload.single('image'), async (req, res) => {
  try {
    const { name, category, storeId, price } = req.body;

    if (!name || !category || !storeId || !price) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : '';

    const pending = await PendingProduct.create({
      name,
      category,
      storeId,
      storeName: store.name,
      price: parseFloat(price),
      image: imageUrl,
    });

    res.status(201).json({ success: true, data: pending, message: 'Submitted for review' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
