const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Store = require('../models/Store');
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
      pendingReviews, approvedReviews, rejectedReviews, totalStores
    ] = await Promise.all([
      Product.countDocuments({ status: 'pending' }),
      Product.countDocuments({ status: 'approved' }),
      Product.countDocuments({ status: 'rejected' }),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' }),
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
      }

      await existingProduct.save();

      // Delete the pending submission as it's now merged into the existing approved doc
      await Product.findByIdAndDelete(pending._id);

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
    const rejected = await Product.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { status: 'rejected' },
      { new: true }
    );
    if (!rejected) return res.status(404).json({ success: false, error: 'Pending submission not found' });
    res.json({ success: true, data: rejected });
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
    const review = await Review.findByIdAndUpdate(
      req.params.id, { status: 'rejected' }, { new: true }
    );
    if (!review) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Store Management ────────────────────────────────
// POST /api/admin/stores
router.post('/stores', auth, async (req, res) => {
  try {
    const { name, address, lat, lng, image, peakHours, offPeakHours } = req.body;

    if (!name || !address || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Name, address, lat, and lng are required' });
    }

    const store = await Store.create({
      name,
      address,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      image: image || '',
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

// DELETE /api/admin/stores/:id
router.delete('/stores/:id', auth, async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    // Also delete associated products and reviews
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
