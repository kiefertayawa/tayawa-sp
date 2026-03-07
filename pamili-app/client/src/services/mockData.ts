// ============================================================
// PAMILI - Mock Data
// Used in place of real API calls during development / demo.
// Matches the TypeScript types in src/types/index.ts exactly.
// ============================================================

import type { Store, Product, Review } from '../types';

// ─── Stores ───────────────────────────────────────────────────────────────────

export const MOCK_STORES: Store[] = [
    {
        _id: 'store-1',
        name: 'Puregold Los Baños',
        address: 'Lopez Ave, Batong Malake, Los Baños',
        location: { lat: 14.1664, lng: 121.2417 },
        rating: 4.5,
        reviewCount: 234,
        peakHours: '10:00-11:00AM',
        offPeakHours: '7:00-8:00AM',
        lastCrowdLevel: 'high',
        lastCrowdTime: new Date().toISOString(), // LIVE PULSE: Busy now
        image: 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=800&auto=format&fit=crop',
    },
    {
        _id: 'store-2',
        name: 'LB Square Public Market',
        address: 'Batong Malake, Los Baños',
        location: { lat: 14.1670, lng: 121.2430 },
        rating: 4.2,
        reviewCount: 189,
        peakHours: '6:00-7:00AM',
        offPeakHours: '10:00-11:00AM',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop',
    },
    {
        _id: 'store-3',
        name: 'Mini Stop Los Baños',
        address: 'Lopez Ave, Batong Malake, Los Baños',
        location: { lat: 14.1658, lng: 121.2420 },
        rating: 4.0,
        reviewCount: 156,
        peakHours: '12:00-1:00PM',
        offPeakHours: '8:00-9:00AM',
        lastCrowdLevel: 'low',
        lastCrowdTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // LIVE PULSE: Low 30 min ago
        image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop',
    },
    {
        _id: 'store-4',
        name: 'Savemore Market Los Baños',
        address: 'CM Recto Ave, Los Baños, Laguna',
        location: { lat: 14.1680, lng: 121.2410 },
        rating: 4.3,
        reviewCount: 201,
        peakHours: '11:00-12:00PM',
        offPeakHours: '8:00-9:00AM',
        image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop',
    },
    {
        _id: 'store-5',
        name: 'University Store',
        address: 'UPLB Campus, Los Baños',
        location: { lat: 14.1650, lng: 121.2425 },
        rating: 3.9,
        reviewCount: 312,
        peakHours: '7:00-8:00AM',
        offPeakHours: '2:00-3:00PM',
        image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&auto=format&fit=crop',
    },
    {
        _id: 'store-6',
        name: '7-Eleven Batong Malake',
        address: 'Batong Malake, Los Baños',
        location: { lat: 14.1662, lng: 121.2415 },
        rating: 4.1,
        reviewCount: 178,
        peakHours: '6:00-7:00AM',
        offPeakHours: '9:00-10:00AM',
        image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&auto=format&fit=crop',
    },
];

// ─── Products ─────────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
    {
        _id: 'prod-1',
        name: 'Rice (NFA) - 1kg',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop',
        prices: [
            { storeId: 'store-1', storeName: 'Puregold Los Baños', price: 42.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-2', storeName: 'LB Square Public Market', price: 40.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-4', storeName: 'Savemore Market Los Baños', price: 43.00, lastUpdated: '2025-11-14', inStock: true },
        ],
        priceHistory: [
            { date: '2025-09-01', price: 45.00 },
            { date: '2025-10-01', price: 43.00 },
            { date: '2025-11-01', price: 40.00 },
        ],
    },
    {
        _id: 'prod-2',
        name: 'Eggs (Medium) - 1 dozen',
        image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&auto=format&fit=crop',
        prices: [
            { storeId: 'store-1', storeName: 'Puregold Los Baños', price: 96.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-2', storeName: 'LB Square Public Market', price: 90.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-3', storeName: 'Mini Stop Los Baños', price: 102.00, lastUpdated: '2025-11-14', inStock: true },
            { storeId: 'store-4', storeName: 'Savemore Market Los Baños', price: 98.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-5', storeName: 'University Store', price: 94.00, lastUpdated: '2025-11-13', inStock: false },
            { storeId: 'store-6', storeName: '7-Eleven Batong Malake', price: 105.00, lastUpdated: '2025-11-15', inStock: true },
        ],
        priceHistory: [
            { date: '2025-09-01', price: 100.00 },
            { date: '2025-10-01', price: 95.00 },
            { date: '2025-11-01', price: 90.00 },
        ],
    },
    {
        _id: 'prod-3',
        name: 'Lucky Me Pancit Canton',
        image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&auto=format&fit=crop',
        prices: [
            { storeId: 'store-1', storeName: 'Puregold Los Baños', price: 14.50, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-3', storeName: 'Mini Stop Los Baños', price: 15.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-4', storeName: 'Savemore Market Los Baños', price: 12.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-6', storeName: '7-Eleven Batong Malake', price: 15.00, lastUpdated: '2025-11-14', inStock: true },
        ],
        priceHistory: [
            { date: '2025-09-01', price: 14.00 },
            { date: '2025-10-01', price: 14.50 },
            { date: '2025-11-01', price: 12.00 },
        ],
    },
    {
        _id: 'prod-4',
        name: 'Emperador Light',
        image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&auto=format&fit=crop',
        prices: [
            { storeId: 'store-3', storeName: 'Mini Stop Los Baños', price: 42.00, lastUpdated: '2025-11-14', inStock: true },
            { storeId: 'store-6', storeName: '7-Eleven Batong Malake', price: 44.00, lastUpdated: '2025-11-15', inStock: true },
        ],
        priceHistory: [
            { date: '2025-09-01', price: 40.00 },
            { date: '2025-10-01', price: 42.00 },
            { date: '2025-11-01', price: 42.00 },
        ],
    },
    {
        _id: 'prod-5',
        name: 'San Miguel Pale Pilsen',
        image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&auto=format&fit=crop',
        prices: [
            { storeId: 'store-3', storeName: 'Mini Stop Los Baños', price: 48.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-4', storeName: 'Savemore Market Los Baños', price: 46.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-6', storeName: '7-Eleven Batong Malake', price: 50.00, lastUpdated: '2025-11-14', inStock: true },
        ],
        priceHistory: [
            { date: '2025-09-01', price: 46.00 },
            { date: '2025-10-01', price: 48.00 },
            { date: '2025-11-01', price: 46.00 },
        ],
    },
    {
        _id: 'prod-6',
        name: 'Mongol Pencil',
        image: 'https://images.unsplash.com/photo-1589556264800-08ae9e129a4e?w=400&auto=format&fit=crop',
        prices: [
            { storeId: 'store-5', storeName: 'University Store', price: 8.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-1', storeName: 'Puregold Los Baños', price: 9.50, lastUpdated: '2025-11-13', inStock: true },
        ],
        priceHistory: [
            { date: '2025-09-01', price: 8.00 },
            { date: '2025-10-01', price: 8.00 },
            { date: '2025-11-01', price: 8.00 },
        ],
    },
    {
        _id: 'prod-7',
        name: 'Instant Noodles (Lucky Me) - 1 pack',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop',
        prices: [
            { storeId: 'store-4', storeName: 'Savemore Market Los Baños', price: 12.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-1', storeName: 'Puregold Los Baños', price: 13.00, lastUpdated: '2025-11-15', inStock: true },
        ],
        priceHistory: [
            { date: '2025-09-01', price: 13.00 },
            { date: '2025-10-01', price: 12.50 },
            { date: '2025-11-01', price: 12.00 },
        ],
    },
    {
        _id: 'prod-8',
        name: 'Coke 1.5L',
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&auto=format&fit=crop',
        prices: [
            { storeId: 'store-1', storeName: 'Puregold Los Baños', price: 65.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-4', storeName: 'Savemore Market Los Baños', price: 63.00, lastUpdated: '2025-11-15', inStock: true },
            { storeId: 'store-3', storeName: 'Mini Stop Los Baños', price: 70.00, lastUpdated: '2025-11-14', inStock: false },
        ],
        priceHistory: [
            { date: '2025-09-01', price: 68.00 },
            { date: '2025-10-01', price: 65.00 },
            { date: '2025-11-01', price: 63.00 },
        ],
    },
];

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const MOCK_REVIEWS: Review[] = [
    {
        _id: 'rev-1',
        storeId: 'store-1',
        userName: 'Juan D.',
        rating: 5,
        date: '2025-11-14',
        text: 'Great selection of products and very affordable prices. Shelves are always well-stocked.',
        status: 'approved',
    },
    {
        _id: 'rev-2',
        storeId: 'store-1',
        userName: 'Maria S.',
        rating: 4,
        date: '2025-11-10',
        text: 'Good store overall. Gets a bit crowded during lunch and after office hours.',
        status: 'approved',
    },
    {
        _id: 'rev-3',
        storeId: 'store-2',
        userName: 'Jose R.',
        rating: 4,
        date: '2025-11-12',
        text: 'Fresh produce every morning! Best place to buy vegetables in Los Baños.',
        status: 'approved',
    },
    {
        _id: 'rev-4',
        storeId: 'store-2',
        userName: 'Ana L.',
        rating: 3,
        date: '2025-11-08',
        text: 'Prices are good but parking can be a hassle during peak hours.',
        status: 'approved',
    },
    {
        _id: 'rev-5',
        storeId: 'store-3',
        userName: 'Pedro M.',
        rating: 4,
        date: '2025-11-13',
        text: '24/7 convenience. Prices are a bit higher than grocery stores but the convenience is worth it.',
        status: 'approved',
    },
    {
        _id: 'rev-6',
        storeId: 'store-4',
        userName: 'Clara B.',
        rating: 5,
        date: '2025-11-11',
        text: 'My go-to supermarket. Great prices on dairy and frozen goods.',
        status: 'approved',
    },
    {
        _id: 'rev-7',
        storeId: 'store-5',
        userName: 'Miguel T.',
        rating: 4,
        date: '2025-11-09',
        text: 'Convenient for students. Has most school supplies you need at reasonable prices.',
        status: 'approved',
    },
];

// ─── Pending Admin Items ───────────────────────────────────────────────────────
// (Obsolete: Pending items are now unified with main collections)
