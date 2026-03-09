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

const { upload, uploadToCloudinary } = require('../middleware/upload');

// POST /api/reviews — submit a new review (goes to pending)
router.post('/', upload.array('images', 3), async (req, res) => {
  try {
    const { storeId, rating, text } = req.body;

    if (!storeId || !rating) {
      console.error('Review Validation Failed. Received:', Object.keys(req.body));
      return res.status(400).json({
        success: false,
        error: 'storeId and rating are required',
        debug: { receivedBody: Object.keys(req.body), hasFile: !!req.files }
      });
    }

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    let finalImages = [];

    // Fallback: If they somehow pass old URL array
    if (req.body.images) {
      finalImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      finalImages = []; // prioritize real file uploads
      try {
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, 'pamili/reviews'));
        const results = await Promise.all(uploadPromises);
        finalImages = results.map(r => ({ url: r.url, publicId: r.public_id }));
      } catch (uploadError) {
        console.error('CRITICAL: Cloudinary upload failed in review route:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload images to cloud' });
      }
    }

    const review = await Review.create({
      storeId,
      rating: parseInt(rating),
      text,
      status: 'pending',
      userName: 'Anonymous User',
      images: finalImages,
      date: new Date().toISOString()
    });
    res.status(201).json({ success: true, data: review, message: 'Review submitted for moderation' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
