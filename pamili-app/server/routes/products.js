const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../models/Store');
const upload = require('../middleware/upload');

// GET /api/products — get all approved products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ status: 'approved' }).sort({ name: 1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/suggestions?q=... — autocomplete: returns matching product names only
// This works by using a case-insensitive regular expression ($regex) to find
// products whose names contain the user's input string.
// We limit the result to 8 items and return only unique names.
router.get('/suggestions', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });

    // We only want to suggest products that are 'approved' and have at
    // least one price entry (meaning they actually exist in a store).
    const products = await Product.find(
      {
        name: { $regex: q, $options: 'i' },
        status: 'approved',
        'prices.0': { $exists: true }
      },
      { name: 1 }   // projection: only the name field
    ).limit(8).sort({ name: 1 });

    const names = [...new Set(products.map(p => p.name))];
    res.json({ success: true, data: names });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/search?q=rice — search by name
// Returns full product objects that match the query and are currently in stock.
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ success: true, data: [] });

    const regex = new RegExp(q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');

    const products = await Product.find({
      name: regex,
      status: 'approved'
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
    if (!product || (product.status !== 'approved' && !req.user?.isAdmin)) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products/submit — community submits a product price
router.post('/submit', async (req, res) => {
  try {
    const { name, storeId, price, image } = req.body;
    const DEFAULT_IMAGE = 'https://placehold.co/400x400?text=No+Image+Available';

    if (!name || !storeId || !price) {
      return res.status(400).json({ success: false, error: 'Name, store, and price are required' });
    }

    // Validation: Regex for name
    const nameRegex = /^[a-zA-Z0-9\s\-\.\&\'\(\)]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ success: false, error: 'Product name contains invalid characters.' });
    }

    // Validation: Positive price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number.' });
    }

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    // In this unified approach, a submission is just a Product document with status: 'pending'
    const sub = await Product.create({
      name: name.trim(),
      image: image ? image.trim() : DEFAULT_IMAGE,
      status: 'pending',
      prices: [{
        storeId,
        storeName: store.name,
        price: priceNum,
        inStock: true,
        lastUpdated: new Date().toISOString().split('T')[0]
      }]
    });

    res.status(201).json({ success: true, data: sub, message: 'Submitted for review' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
