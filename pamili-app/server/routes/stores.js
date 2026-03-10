const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const Product = require('../models/Product');

// GET /api/stores — get all stores
router.get('/', async (req, res) => {
  try {
    const stores = await Store.find().sort({ name: 1 });
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/stores/:id — get one store
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/stores/:id/products — get products available at this store
router.get('/:id/products', async (req, res) => {
  try {
    const products = await Product.find({
      'prices.storeId': req.params.id,
      status: 'approved'
    });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
