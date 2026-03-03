const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Store = require('../models/Store');

// GET /api/reviews?storeId=xxx — get approved reviews for a store
router.get('/', async (req, res) => {
  try {
    const { storeId } = req.query;
    if (!storeId) return res.status(400).json({ success: false, error: 'storeId is required' });

    const reviews = await Review.find({ storeId, status: 'approved' }).sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reviews — submit a new review (goes to pending)
router.post('/', async (req, res) => {
  try {
    const { storeId, rating, text } = req.body;

    if (!storeId || !rating) {
      return res.status(400).json({ success: false, error: 'storeId and rating are required' });
    }

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    const review = await Review.create({
      storeId,
      rating: parseInt(rating),
      text,
      status: 'pending',
      userName: 'Anonymous User',
      images: Array.isArray(req.body.images) ? req.body.images : [],
      date: new Date().toISOString()
    });
    res.status(201).json({ success: true, data: review, message: 'Review submitted for moderation' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
