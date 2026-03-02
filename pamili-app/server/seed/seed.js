// ============================================================
// PAMILI - Database Seed Script
// Populates MongoDB with all the mock data from the Figma project
// Run with: npm run seed
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Store     = require('../models/Store');
const Product   = require('../models/Product');
const Review    = require('../models/Review');
const Admin     = require('../models/Admin');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pamili';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Store.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Admin.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── Seed Stores ─────────────────────────────────────
  const stores = await Store.insertMany([
    {
      name: 'Puregold Los Baños',
      location: { lat: 14.1654, lng: 121.2437 },
      address: 'Lopez Ave, Batong Malake, Los Baños',
      rating: 4.5, reviewCount: 234,
      crowdLevel: 'medium',
      peakHours: ['10:00 AM - 12:00 PM', '5:00 PM - 7:00 PM'],
      offPeakHours: ['7:00 AM - 9:00 AM', '2:00 PM - 4:00 PM'],
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      categories: ['Groceries', 'Personal Care', 'Household'],
    },
    {
      name: 'LB Square Public Market',
      location: { lat: 14.1689, lng: 121.2423 },
      address: 'Batong Malake, Los Baños',
      rating: 4.2, reviewCount: 189,
      crowdLevel: 'high',
      peakHours: ['6:00 AM - 9:00 AM', '4:00 PM - 6:00 PM'],
      offPeakHours: ['10:00 AM - 3:00 PM'],
      image: 'https://images.unsplash.com/photo-1556360853-3b6982e79d9f?w=800',
      categories: ['Fresh Produce', 'Meat', 'Seafood'],
    },
    {
      name: 'Mini Stop Los Baños',
      location: { lat: 14.1672, lng: 121.2445 },
      address: 'Lopez Ave, Batong Malake, Los Baños',
      rating: 4.0, reviewCount: 156,
      crowdLevel: 'low',
      peakHours: ['12:00 PM - 1:00 PM', '6:00 PM - 8:00 PM'],
      offPeakHours: ['8:00 AM - 11:00 AM', '2:00 PM - 5:00 PM'],
      image: 'https://images.unsplash.com/photo-1611250308498-9e325502f8ee?w=800',
      categories: ['Convenience', 'Ready-to-Eat', 'Snacks'],
    },
    {
      name: 'Savemore Market Los Baños',
      location: { lat: 14.1645, lng: 121.2411 },
      address: 'Batong Malake, Los Baños',
      rating: 4.3, reviewCount: 201,
      crowdLevel: 'medium',
      peakHours: ['11:00 AM - 1:00 PM', '5:00 PM - 7:00 PM'],
      offPeakHours: ['8:00 AM - 10:00 AM', '2:00 PM - 4:00 PM'],
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800',
      categories: ['Groceries', 'Fresh Produce', 'Household'],
    },
    {
      name: 'University Store',
      location: { lat: 14.1698, lng: 121.2456 },
      address: 'UPLB Campus, Los Baños',
      rating: 3.9, reviewCount: 312,
      crowdLevel: 'high',
      peakHours: ['7:00 AM - 9:00 AM', '12:00 PM - 1:00 PM', '4:00 PM - 6:00 PM'],
      offPeakHours: ['9:00 AM - 11:00 AM', '2:00 PM - 3:00 PM'],
      image: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=800',
      categories: ['School Supplies', 'Snacks', 'Beverages'],
    },
    {
      name: '7-Eleven Batong Malake',
      location: { lat: 14.1662, lng: 121.2419 },
      address: 'Batong Malake, Los Baños',
      rating: 4.1, reviewCount: 178,
      crowdLevel: 'low',
      peakHours: ['7:00 AM - 8:00 AM', '12:00 PM - 1:00 PM'],
      offPeakHours: ['9:00 AM - 11:00 AM', '2:00 PM - 6:00 PM'],
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      categories: ['Convenience', 'Beverages', 'Ready-to-Eat'],
    },
  ]);

  // Map store names to their new MongoDB _ids
  const s = {};
  stores.forEach(store => { s[store.name] = store._id; });
  console.log(`🏪 Seeded ${stores.length} stores`);

  // ─── Seed Products ────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];

  await Product.insertMany([
    {
      name: 'Rice (NFA) - 1kg', category: 'Grains',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      rating: 4.5, reviewCount: 45,
      prices: [
        { storeId: s['Puregold Los Baños'],        storeName: 'Puregold Los Baños',        price: 42, lastUpdated: today, inStock: true },
        { storeId: s['LB Square Public Market'],   storeName: 'LB Square Public Market',   price: 40, lastUpdated: today, inStock: true },
        { storeId: s['Savemore Market Los Baños'], storeName: 'Savemore Market Los Baños', price: 43, lastUpdated: today, inStock: true },
      ],
      priceHistory: [{ date: '2025-11-01', price: 41 }, { date: '2025-11-08', price: 42 }],
    },
    {
      name: 'Eggs (Medium) - 1 dozen', category: 'Protein',
      image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
      rating: 4.3, reviewCount: 67,
      prices: [
        { storeId: s['Puregold Los Baños'],        storeName: 'Puregold Los Baños',        price: 95, lastUpdated: today, inStock: true },
        { storeId: s['LB Square Public Market'],   storeName: 'LB Square Public Market',   price: 90, lastUpdated: today, inStock: true },
        { storeId: s['Savemore Market Los Baños'], storeName: 'Savemore Market Los Baños', price: 93, lastUpdated: today, inStock: true },
      ],
    },
    {
      name: 'Instant Noodles (Lucky Me) - 1 pack', category: 'Instant Food',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
      rating: 4.7, reviewCount: 89,
      prices: [
        { storeId: s['Puregold Los Baños'],        storeName: 'Puregold Los Baños',        price: 12.50, lastUpdated: today, inStock: true },
        { storeId: s['Mini Stop Los Baños'],       storeName: 'Mini Stop Los Baños',       price: 14.00, lastUpdated: today, inStock: true },
        { storeId: s['Savemore Market Los Baños'], storeName: 'Savemore Market Los Baños', price: 12.00, lastUpdated: today, inStock: true },
        { storeId: s['University Store'],          storeName: 'University Store',          price: 13.50, lastUpdated: today, inStock: true },
        { storeId: s['7-Eleven Batong Malake'],    storeName: '7-Eleven Batong Malake',    price: 14.50, lastUpdated: today, inStock: true },
      ],
    },
    {
      name: 'Notebook (80 leaves)', category: 'School Supplies',
      image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400',
      rating: 4.4, reviewCount: 112,
      prices: [
        { storeId: s['Puregold Los Baños'], storeName: 'Puregold Los Baños', price: 35, lastUpdated: today, inStock: true },
        { storeId: s['University Store'],   storeName: 'University Store',   price: 32, lastUpdated: today, inStock: true },
      ],
    },
    {
      name: 'Bottled Water (500ml)', category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
      rating: 4.6, reviewCount: 203,
      prices: [
        { storeId: s['Puregold Los Baños'],     storeName: 'Puregold Los Baños',     price: 10, lastUpdated: today, inStock: true },
        { storeId: s['Mini Stop Los Baños'],    storeName: 'Mini Stop Los Baños',    price: 12, lastUpdated: today, inStock: true },
        { storeId: s['University Store'],       storeName: 'University Store',       price: 15, lastUpdated: today, inStock: true },
        { storeId: s['7-Eleven Batong Malake'], storeName: '7-Eleven Batong Malake', price: 13, lastUpdated: today, inStock: true },
      ],
    },
    {
      name: 'Cooking Oil (1L)', category: 'Cooking Essentials',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
      rating: 4.2, reviewCount: 56,
      prices: [
        { storeId: s['Puregold Los Baños'],        storeName: 'Puregold Los Baños',        price: 85, lastUpdated: today, inStock: true },
        { storeId: s['LB Square Public Market'],   storeName: 'LB Square Public Market',   price: 82, lastUpdated: today, inStock: true },
        { storeId: s['Savemore Market Los Baños'], storeName: 'Savemore Market Los Baños', price: 84, lastUpdated: today, inStock: true },
      ],
    },
    {
      name: 'Canned Sardines', category: 'Canned Goods',
      image: 'https://images.unsplash.com/photo-1600353068440-6361ef3a86e8?w=400',
      rating: 4.5, reviewCount: 78,
      prices: [
        { storeId: s['Puregold Los Baños'],        storeName: 'Puregold Los Baños',        price: 22.50, lastUpdated: today, inStock: true },
        { storeId: s['Mini Stop Los Baños'],       storeName: 'Mini Stop Los Baños',       price: 25.00, lastUpdated: today, inStock: true },
        { storeId: s['Savemore Market Los Baños'], storeName: 'Savemore Market Los Baños', price: 23.00, lastUpdated: today, inStock: true },
        { storeId: s['7-Eleven Batong Malake'],    storeName: '7-Eleven Batong Malake',    price: 26.00, lastUpdated: today, inStock: true },
      ],
    },
    {
      name: 'Laundry Detergent (500g)', category: 'Household',
      image: 'https://images.unsplash.com/photo-1563948450208-0ebc2cc1820f?w=400',
      rating: 4.3, reviewCount: 91,
      prices: [
        { storeId: s['Puregold Los Baños'],        storeName: 'Puregold Los Baños',        price: 65, lastUpdated: today, inStock: true },
        { storeId: s['Savemore Market Los Baños'], storeName: 'Savemore Market Los Baños', price: 63, lastUpdated: today, inStock: true },
      ],
    },
    {
      name: 'Bread (Loaf)', category: 'Bakery',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
      rating: 4.6, reviewCount: 134,
      prices: [
        { storeId: s['Puregold Los Baños'],        storeName: 'Puregold Los Baños',        price: 45, lastUpdated: today, inStock: true },
        { storeId: s['LB Square Public Market'],   storeName: 'LB Square Public Market',   price: 40, lastUpdated: today, inStock: true },
        { storeId: s['Mini Stop Los Baños'],       storeName: 'Mini Stop Los Baños',       price: 48, lastUpdated: today, inStock: true },
        { storeId: s['7-Eleven Batong Malake'],    storeName: '7-Eleven Batong Malake',    price: 50, lastUpdated: today, inStock: true },
      ],
    },
    {
      name: 'Ballpen (Blue)', category: 'School Supplies',
      image: 'https://images.unsplash.com/photo-1586716402203-79219bede43c?w=400',
      rating: 4.4, reviewCount: 87,
      prices: [
        { storeId: s['Puregold Los Baños'], storeName: 'Puregold Los Baños', price: 8.00, lastUpdated: today, inStock: true },
        { storeId: s['University Store'],   storeName: 'University Store',   price: 7.50, lastUpdated: today, inStock: true },
      ],
    },
  ]);
  console.log('📦 Seeded 10 products');

  // ─── Seed Reviews ─────────────────────────────────────
  await Review.insertMany([
    { storeId: s['Puregold Los Baños'],        userName: 'Anonymous Student', rating: 5, text: 'Great prices and wide selection! The store is clean and well-organized. Perfect for students on a budget.', status: 'approved', date: '2025-11-10' },
    { storeId: s['Puregold Los Baños'],        userName: 'Anonymous Student', rating: 4, text: 'Good variety of products. Can get crowded during peak hours but staff are helpful.', status: 'approved', date: '2025-11-08' },
    { storeId: s['LB Square Public Market'],   userName: 'Anonymous Student', rating: 5, text: 'Best place for fresh vegetables and meat! Prices are cheaper compared to supermarkets. Just come early to avoid the crowd.', status: 'approved', date: '2025-11-12' },
    { storeId: s['LB Square Public Market'],   userName: 'Anonymous Student', rating: 4, text: 'Very affordable prices, especially for fresh produce. The market can be hot during midday though.', status: 'approved', date: '2025-11-05' },
    { storeId: s['Mini Stop Los Baños'],       userName: 'Anonymous Student', rating: 4, text: 'Convenient location near campus. Good for quick snacks and drinks. A bit pricey but open 24/7.', status: 'approved', date: '2025-11-14' },
    { storeId: s['Savemore Market Los Baños'], userName: 'Anonymous Student', rating: 5, text: 'Competitive prices and friendly staff. Less crowded than other supermarkets. Highly recommended!', status: 'approved', date: '2025-11-11' },
    { storeId: s['University Store'],          userName: 'Anonymous Student', rating: 3, text: 'Convenient for students but prices are higher. Limited selection compared to bigger stores.', status: 'approved', date: '2025-11-13' },
    { storeId: s['University Store'],          userName: 'Anonymous Student', rating: 4, text: 'Good for school supplies and quick snacks between classes. Gets very crowded during lunch time.', status: 'approved', date: '2025-11-09' },
    { storeId: s['7-Eleven Batong Malake'],    userName: 'Anonymous Student', rating: 4, text: 'Always open which is great for late night needs. Staff are friendly and store is clean.', status: 'approved', date: '2025-11-15' },
  ]);
  console.log('⭐ Seeded 9 reviews');

  // ─── Seed Admin ───────────────────────────────────────
  await Admin.create({
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'pamili_admin_2024',
  });
  console.log('👤 Seeded admin user');

  await mongoose.disconnect();
  console.log('\n🎉 Seed complete! Your database is ready.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
