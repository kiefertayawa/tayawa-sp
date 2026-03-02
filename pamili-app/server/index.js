// ============================================================
// PAMILI - Express Server Entry Point
// ============================================================

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');

const storeRoutes   = require('./routes/stores');
const productRoutes = require('./routes/products');
const reviewRoutes  = require('./routes/reviews');
const adminRoutes   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/stores',   storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/admin',    adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PAMILI server is running 🎉' });
});

// ─── MongoDB ──────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pamili')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
