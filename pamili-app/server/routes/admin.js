const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Store = require('../models/Store');
const Report = require('../models/Report');
const auth = require('../middleware/auth');

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
      expiresIn: '1h',
    });

    res.json({ success: true, data: { token } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Products & Submissions ───────────────────────────

// GET /api/admin/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const [
      pendingProducts, approvedProducts, rejectedProducts,
      pendingReviews, approvedReviews, rejectedReviews,
      pendingReports, totalStores
    ] = await Promise.all([
      Product.countDocuments({ status: 'pending' }),
      Product.countDocuments({ status: 'approved' }),
      Product.countDocuments({ status: 'rejected' }),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' }),
      Report.countDocuments({ status: 'pending' }),
      Store.countDocuments(),
    ]);
    res.json({
      success: true,
      data: {
        totalStores,
        pendingProducts,
        approvedProducts,
        rejectedProducts,
        pendingReviews,
        approvedReviews,
        rejectedReviews,
        pendingReports,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/products/pending
router.get('/products/pending', auth, async (req, res) => {
  try {
    const pending = await Product.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, data: pending });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/products — get ALL products with pagination
router.get('/products', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    const products = await Product.aggregate([
      {
        $addFields: {
          statusPriority: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'pending'] }, then: 0 },
                { case: { $eq: ['$status', 'approved'] }, then: 1 },
                { case: { $eq: ['$status', 'rejected'] }, then: 2 }
              ],
              default: 3
            }
          }
        }
      },
      { $sort: { statusPriority: 1, updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/products/:id/approve
router.patch('/products/:id/approve', auth, async (req, res) => {
  try {
    // 1. Find the pending product submission (Submission is a Product doc with status: 'pending')
    const pending = await Product.findOne({ _id: req.params.id, status: 'pending' });
    if (!pending) return res.status(404).json({ success: false, error: 'Pending submission not found' });

    const today = new Date().toISOString().split('T')[0];
    const submissionStore = pending.prices[0]; // submissions from form always have 1 price entry

    // 2. Check if an APPROVED product with the same name already exists
    let existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${pending.name}$`, 'i') },
      status: 'approved'
    });

    // --- NEW: Aggregated Store Insights (Crowd Level & Peak Hours) ---
    // Only aggregate if the user was near the store (locationVerified) and provided a level
    if (pending.locationVerified && pending.crowdLevel && pending.crowdLevel !== 'not_sure') {
      // Fetch ALL approved products for this store that are verified and have a crowd level
      const allApprovedSubmissions = await Product.find({
        'prices.storeId': submissionStore.storeId,
        status: 'approved',
        locationVerified: true,
        crowdLevel: { $in: ['low', 'medium', 'high'] }
      }).sort({ createdAt: -1 });

      const allData = [pending, ...allApprovedSubmissions];

      // 1. Calculate Current Crowd Level (Refined Logic)
      const counts = { low: 0, medium: 0, high: 0 };
      allData.forEach(d => counts[d.crowdLevel]++);

      let currentCrowdLevel = 'medium'; // Default to Moderate

      // Clear winner check
      if (counts.high > counts.low && counts.high >= counts.medium) {
        currentCrowdLevel = 'high';
      } else if (counts.low > counts.high && counts.low >= counts.medium) {
        currentCrowdLevel = 'low';
      } else {
        // If it's a tie between high/low, or medium is the majority, it's Moderate
        currentCrowdLevel = 'medium';
      }

      // 2. Calculate Peak/Off-Peak (Recency-Based Community Data)
      const hourCounts = { high: {}, low: {} };
      const lastSeen = { high: {}, low: {} };

      allData.forEach(d => {
        if (d.crowdLevel === 'high' || d.crowdLevel === 'low') {
          const date = new Date(d.submittedDate || d.createdAt);

          // Force conversion to Philippine Time (UTC+8)
          // Since Render runs in UTC, Date.getHours() returns a time 8 hours behind.
          const phtMs = date.getTime() + (8 * 60 * 60 * 1000);
          const phtDate = new Date(phtMs);

          const h = phtDate.getUTCHours();
          const ts = date.getTime();

          const startH = h % 12 || 12;
          const endH = (h + 1) % 12 || 12;
          const ampm = (h + 1) >= 12 && (h + 1) < 24 ? 'PM' : 'AM';
          const range = `${startH}:00-${endH}:00${ampm}`;

          hourCounts[d.crowdLevel][range] = (hourCounts[d.crowdLevel][range] || 0) + 1;
          if (!lastSeen[d.crowdLevel][range] || ts > lastSeen[d.crowdLevel][range]) {
            lastSeen[d.crowdLevel][range] = ts;
          }
        }
      });

      const getTopRange = (data, targetRecency, otherRecency, otherData = {}, exclude = null) => {
        let keys = Object.keys(data).filter(k => {
          if (exclude && k === exclude) return false;
          const myCount = data[k] || 0;
          const otherCount = otherData[k] || 0;

          if (myCount > otherCount) return true;
          if (myCount < otherCount) return false;

          // Tie-Breaker for the SAME slot (e.g. 1 High vs 1 Low):
          // The status reported most recently wins the pattern for that hour.
          const myLatest = targetRecency[k] || 0;
          const otherLatest = otherRecency[k] || 0;
          return myLatest > otherLatest;
        });

        if (keys.length === 0) return null;

        return keys.reduce((a, b) => {
          if (data[a] > data[b]) return a;
          if (data[b] > data[a]) return b;
          // Tie-breaker for DIFFERENT slots (e.g. 12PM vs 1PM)
          return targetRecency[a] > targetRecency[b] ? a : b;
        });
      };

      const peakRange = getTopRange(hourCounts.high, lastSeen.high, lastSeen.low, hourCounts.low);
      // Ensure off-peak is never the same as peak
      const offPeakRange = getTopRange(hourCounts.low, lastSeen.low, lastSeen.high, hourCounts.high, peakRange);

      // 3. Update Store (Safe Pulse Update)
      const currentStore = await Store.findById(submissionStore.storeId);
      const reportTime = pending.createdAt;

      const storeUpdate = {
        peakHours: peakRange || '',
        offPeakHours: offPeakRange || ''
      };

      // ONLY update the Live Snapshot if this report is newer than the stored one
      if (!currentStore.lastCrowdTime || reportTime > currentStore.lastCrowdTime) {
        storeUpdate.lastCrowdLevel = pending.crowdLevel;
        storeUpdate.lastCrowdTime = reportTime;
      }

      await Store.findByIdAndUpdate(submissionStore.storeId, storeUpdate);
    }
    // -------------------------------------------------------------

    if (existingProduct) {
      // Logic: Merge the submission's price into the existing approved product
      const existingPriceIdx = existingProduct.prices.findIndex(
        (p) => p.storeId.toString() === submissionStore.storeId.toString()
      );

      if (existingPriceIdx > -1) {
        const existingPrice = existingProduct.prices[existingPriceIdx];
        // Move old price to history
        existingProduct.priceHistory.push({ date: existingPrice.lastUpdated || today, price: existingPrice.price });

        // Update to new price
        existingProduct.prices[existingPriceIdx].price = submissionStore.price;
        existingProduct.prices[existingPriceIdx].lastUpdated = today;
        existingProduct.prices[existingPriceIdx].inStock = true;
      } else {
        // Add as a new store entry
        existingProduct.prices.push({
          storeId: submissionStore.storeId,
          storeName: submissionStore.storeName,
          price: submissionStore.price,
          lastUpdated: today,
          inStock: true,
        });
      }

      // Preserve image if existing has none
      if (!existingProduct.image && pending.image) {
        existingProduct.image = pending.image;
        existingProduct.imagePublicId = pending.imagePublicId;
      }

      await existingProduct.save();

      // Delete the pending submission
      await Product.findByIdAndDelete(pending._id);

      // Clean up Cloudinary: if pending had an image but it wasn't used/merged
      // (because the existing product already had an image)
      if (pending.imagePublicId && existingProduct.imagePublicId !== pending.imagePublicId) {
        await deleteFromCloudinary(pending.imagePublicId);
      }

      res.json({ success: true, data: existingProduct, message: 'Merged into existing approved product' });
    } else {
      // 3. No existing approved product; just flip the status of this one to approved
      pending.status = 'approved';
      if (pending.prices.length > 0) {
        pending.prices[0].lastUpdated = today;
      }
      await pending.save();
      res.json({ success: true, data: pending, message: 'Approved as new product' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/products/:id/reject
router.patch('/products/:id/reject', auth, async (req, res) => {
  try {
    const rejected = await Product.findOne({ _id: req.params.id, status: 'pending' });
    if (!rejected) return res.status(404).json({ success: false, error: 'Pending submission not found' });

    // Delete from Cloudinary if image exists
    if (rejected.imagePublicId) {
      await deleteFromCloudinary(rejected.imagePublicId);
    }

    rejected.status = 'rejected';
    rejected.image = ''; // Clear URL too since file is gone
    rejected.imagePublicId = '';
    await rejected.save();

    res.json({ success: true, data: rejected });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/products/:id — permanently delete a product
router.delete('/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    // Delete image from Cloudinary if exists
    if (product.imagePublicId) {
      await deleteFromCloudinary(product.imagePublicId);
    }

    // Also delete any reports associated with this product
    await Report.deleteMany({ productId: req.params.id });

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Pending Reviews ──────────────────────────────────

// GET /api/admin/reviews/pending — with pagination
router.get('/reviews/pending', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments({ status: { $ne: 'rejected' } });
    const reviews = await Review.aggregate([
      { $match: { status: { $ne: 'rejected' } } },
      {
        $addFields: {
          statusPriority: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'pending'] }, then: 0 },
                { case: { $eq: ['$status', 'approved'] }, then: 1 },
                { case: { $eq: ['$status', 'rejected'] }, then: 2 }
              ],
              default: 3
            }
          }
        }
      },
      { $sort: { statusPriority: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
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
      rating: Math.round(avg * 10) / 10,
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
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Not found' });

    // Delete multiple images from Cloudinary
    if (review.images && review.images.length > 0) {
      const deletePromises = review.images.map(img => {
        if (img.publicId) return deleteFromCloudinary(img.publicId);
      });
      await Promise.all(deletePromises);
    }

    review.status = 'rejected';
    review.images = []; // Clear array since files are gone
    await review.save();

    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// ─── Product Reports Management ───────────────────

// GET /api/admin/reports/pending
router.get('/reports/pending', auth, async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/reports — all reports with pagination
router.get('/reports', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Report.countDocuments();
    const reports = await Report.aggregate([
      {
        $addFields: {
          statusPriority: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'pending'] }, then: 0 },
                { case: { $eq: ['$status', 'resolved'] }, then: 1 }
              ],
              default: 2
            }
          }
        }
      },
      { $sort: { statusPriority: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/reports/:id/resolve
// (Mark the issue as handled — maybe the product was updated/deleted)
router.patch('/reports/:id/resolve', auth, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id, { status: 'resolved' }, { new: true }
    );
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/reports/:id/ignore — permanently remove (ignored = gone)
router.delete('/reports/:id/ignore', auth, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Store Management ────────────────────────────────

// GET /api/admin/stores — with pagination
router.get('/stores', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Store.countDocuments();
    const stores = await Store.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: stores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// POST /api/admin/stores
router.post('/stores', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, address, lat, lng, operatingHours, peakHours, offPeakHours } = req.body;
    let image = req.body.image;
    let imagePublicId = '';

    if (!name || !address || !lat || !lng) {
      console.error('Add Store Validation Failed. Received:', Object.keys(req.body));
      return res.status(400).json({
        success: false,
        error: 'Name, address, and location are required',
        debug: { receivedBody: Object.keys(req.body), hasFile: !!req.file }
      });
    }

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'pamili/stores');
        image = result.url;
        imagePublicId = result.public_id;
      } catch (uploadError) {
        console.error('CRITICAL: Cloudinary upload failed in admin store route:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload store image' });
      }
    }

    const store = await Store.create({
      name,
      address,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      image: image || '',
      imagePublicId: imagePublicId || '',
      operatingHours: operatingHours || '',
      peakHours: peakHours || '',
      offPeakHours: offPeakHours || '',
      rating: 0,
      reviewCount: 0
    });

    res.status(201).json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/stores/:id
router.patch('/stores/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, address, lat, lng, operatingHours, peakHours, offPeakHours } = req.body;
    let image, imagePublicId;

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'pamili/stores');
        image = result.url;
        imagePublicId = result.public_id;
      } catch (uploadError) {
        console.error('Image upload failed during store update:', uploadError);
      }
    }

    const updateData = {
      name,
      address,
      operatingHours,
      peakHours,
      offPeakHours
    };

    if (lat && lng) {
      updateData.location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    if (image) {
      updateData.image = image;
      updateData.imagePublicId = imagePublicId;
    }

    const store = await Store.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/stores/:id
router.delete('/stores/:id', auth, async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    // Delete image from Cloudinary
    if (store.imagePublicId) {
      await deleteFromCloudinary(store.imagePublicId);
    }

    // Find and delete images for all associated products
    const associatedProducts = await Product.find({ 'prices.storeId': req.params.id });
    for (const prod of associatedProducts) {
      if (prod.imagePublicId) {
        await deleteFromCloudinary(prod.imagePublicId);
      }
    }

    // Find and delete images for all associated reviews
    const associatedReviews = await Review.find({ storeId: req.params.id });
    for (const rev of associatedReviews) {
      if (rev.images && rev.images.length > 0) {
        for (const img of rev.images) {
          if (img.publicId) {
            await deleteFromCloudinary(img.publicId);
          }
        }
      }
    }

    // Now delete from database
    await Promise.all([
      Product.deleteMany({ 'prices.storeId': req.params.id }),
      Review.deleteMany({ storeId: req.params.id })
    ]);

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
