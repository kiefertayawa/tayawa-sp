// ============================================================
// PAMILI - API Service Layer
// Currently wired to mock data for frontend development.
// To switch to the real backend, set USE_MOCK = false and
// ensure VITE_API_URL is set to your Express server URL.
// ============================================================

import type { Product, Store, Review, ProductReport, ApiResponse } from '../types';
import {
  MOCK_STORES,
  MOCK_PRODUCTS,
  MOCK_REVIEWS,
} from './mockData';

// ── Toggle this to false when your backend is ready ──────────
//const USE_MOCK = true;
const USE_MOCK = false;

// ── Simulates a network delay (ms) ───────────────────────────
const MOCK_DELAY = 400;

// ── Helper: wrap mock data in Axios-like response shape ──────
function mockResponse<T>(data: T): Promise<{ data: ApiResponse<T> }> {
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ data: { success: true, data } }),
      MOCK_DELAY,
    ),
  );
}

// ─── Real axios instance (used when USE_MOCK = false) ────────
import axios from 'axios';
const PROD_URL = import.meta.env.VITE_API_URL || 'https://pamili-server.onrender.com/api'; // Replace this with your ACTUAL Render URL if not using ENV
const LOCAL_URL = 'http://localhost:5000/api';

const BASE_URL = import.meta.env.PROD ? PROD_URL : LOCAL_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pamili_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Products ─────────────────────────────────────────────────

export const productService = {
  search: (query: string) => {
    if (USE_MOCK) {
      const q = query.toLowerCase();
      const filtered = MOCK_PRODUCTS.filter(
        (p) => p.name.toLowerCase().includes(q)
      );
      return mockResponse(filtered);
    }
    return api.get<ApiResponse<Product[]>>(`/products/search?q=${encodeURIComponent(query)}`);
  },

  getAll: () => {
    if (USE_MOCK) return mockResponse(MOCK_PRODUCTS);
    return api.get<ApiResponse<Product[]>>('/products');
  },

  getById: (id: string) => {
    if (USE_MOCK) {
      const product = MOCK_PRODUCTS.find((p) => p._id === id) ?? null;
      return mockResponse(product as Product);
    }
    return api.get<ApiResponse<Product>>(`/products/${id}`);
  },

  submit: (data: {
    name: string;
    storeId: string;
    price: number;
    image: string | File;
    lat?: number;
    lng?: number;
    crowdLevel?: 'low' | 'medium' | 'high' | 'not_sure';
  }) => {
    if (USE_MOCK) {
      // Simulate a successful submission
      const pending: Product = {
        _id: `pend-${Date.now()}`,
        name: data.name,
        image: typeof data.image === 'string' ? data.image : 'https://placehold.co/400x400?text=Mock+Image',
        crowdLevel: data.crowdLevel || 'low',
        prices: [{
          storeId: data.storeId,
          storeName: 'Unknown Store',
          price: data.price,
          inStock: true,
          lastUpdated: new Date().toISOString().split('T')[0]
        }],
        submittedBy: 'Anonymous Student',
        submittedDate: new Date().toISOString(),
        status: 'pending',
      };
      return mockResponse(pending);
    }
    const formData = new FormData();
    // TEXT FIELDS FIRST
    formData.append('name', data.name);
    formData.append('storeId', data.storeId);
    formData.append('price', data.price.toString());
    if (data.lat !== undefined) formData.append('lat', data.lat.toString());
    if (data.lng !== undefined) formData.append('lng', data.lng.toString());
    if (data.crowdLevel) formData.append('crowdLevel', data.crowdLevel);

    // FILE LAST (Best for production parsers)
    if (data.image) formData.append('image', data.image);

    return api.post<ApiResponse<Product>>('/products/submit', formData);
  },
  getSuggestions: (query: string) => {
    if (USE_MOCK) {
      const q = query.toLowerCase();
      const names = [...new Set(MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(q)).map(p => p.name))].slice(0, 8);
      return mockResponse(names);
    }
    return api.get<ApiResponse<string[]>>(`/products/suggestions?q=${encodeURIComponent(query)}`);
  },

  report: (productId: string, data: { storeId: string; reason: string }) => {
    if (USE_MOCK) return mockResponse({ _id: `rep-${Date.now()}`, ...data, productId } as unknown as ProductReport);
    return api.post<ApiResponse<ProductReport>>(`/products/${productId}/report`, data);
  },
};

// ─── Stores ───────────────────────────────────────────────────

export const storeService = {
  getAll: () => {
    if (USE_MOCK) return mockResponse(MOCK_STORES);
    return api.get<ApiResponse<Store[]>>('/stores');
  },

  getById: (id: string) => {
    if (USE_MOCK) {
      const store = MOCK_STORES.find((s) => s._id === id) ?? null;
      return mockResponse(store as Store);
    }
    return api.get<ApiResponse<Store>>(`/stores/${id}`);
  },

  getProducts: (storeId: string) => {
    if (USE_MOCK) {
      const products = MOCK_PRODUCTS.filter((p) =>
        p.prices.some((pr) => pr.storeId === storeId),
      );
      return mockResponse(products);
    }
    return api.get<ApiResponse<Product[]>>(`/stores/${storeId}/products`);
  },
};

// ─── Reviews ──────────────────────────────────────────────────

export const reviewService = {
  getByStore: (storeId: string) => {
    if (USE_MOCK) {
      const reviews = MOCK_REVIEWS.filter(
        (r) => r.storeId === storeId && r.status === 'approved',
      );
      return mockResponse(reviews);
    }
    return api.get<ApiResponse<Review[]>>(`/reviews?storeId=${storeId}`);
  },

  submit: (data: { storeId: string; rating: number; text: string; images?: (string | File)[] }) => {
    if (USE_MOCK) {
      const review: Review = {
        _id: `rev-${Date.now()}`,
        userName: 'Anonymous User',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        status: 'pending',
        ...data,
        images: data.images?.map(i => typeof i === 'string' ? { url: i, publicId: 'mock-id' } : { url: 'https://placehold.co/400x400?text=Mock', publicId: 'mock-id' }) || [],
      };
      return mockResponse(review);
    }

    const formData = new FormData();
    // TEXT FIELDS FIRST
    formData.append('storeId', data.storeId);
    formData.append('rating', data.rating.toString());
    formData.append('text', data.text);

    // FILES LAST
    if (data.images) {
      data.images.forEach(img => formData.append('images', img));
    }

    return api.post<ApiResponse<Review>>('/reviews', formData);
  },
};

// ─── Admin ────────────────────────────────────────────────────

export const adminService = {
  getPendingProducts: () => {
    if (USE_MOCK) return mockResponse([]);
    return api.get<ApiResponse<Product[]>>('/admin/products/pending');
  },

  getAllProducts: () => {
    if (USE_MOCK) return mockResponse(MOCK_PRODUCTS);
    return api.get<ApiResponse<Product[]>>('/admin/products');
  },

  approveProduct: (id: string) => {
    if (USE_MOCK) {
      return mockResponse({ _id: id, status: 'approved' as const } as Product);
    }
    return api.patch<ApiResponse<Product>>(`/admin/products/${id}/approve`);
  },

  rejectProduct: (id: string) => {
    if (USE_MOCK) {
      return mockResponse({ _id: id, status: 'rejected' as const } as Product);
    }
    return api.patch<ApiResponse<Product>>(`/admin/products/${id}/reject`);
  },

  deleteProduct: (id: string) => {
    if (USE_MOCK) return mockResponse({ _id: id });
    return api.delete<ApiResponse<{}>>(`/admin/products/${id}`);
  },

  getPendingReviews: () => {
    if (USE_MOCK) return mockResponse([]);
    return api.get<ApiResponse<Review[]>>('/admin/reviews/pending');
  },

  approveReview: (id: string) => {
    if (USE_MOCK) {
      return mockResponse({ _id: id, status: 'approved' as const } as Review);
    }
    return api.patch<ApiResponse<Review>>(`/admin/reviews/${id}/approve`);
  },

  rejectReview: (id: string) => {
    if (USE_MOCK) {
      return mockResponse({ _id: id, status: 'rejected' as const } as Review);
    }
    return api.patch<ApiResponse<Review>>(`/admin/reviews/${id}/reject`);
  },

  login: (credentials: { username: string; password: string }) => {
    if (USE_MOCK) {
      // Mock admin credentials: admin / admin123
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        return mockResponse({ token: 'mock-admin-token' });
      }
      return Promise.reject(new Error('Invalid credentials'));
    }
    return api.post<ApiResponse<{ token: string }>>('/admin/login', credentials);
  },

  getStats: (): Promise<{
    data: ApiResponse<{
      pendingProducts: number;
      approvedProducts: number;
      rejectedProducts: number;
      pendingReviews: number;
      approvedReviews: number;
      rejectedReviews: number;
      pendingReports: number;
      totalStores: number;
    }>
  }> => {
    if (USE_MOCK) {
      return mockResponse({
        pendingProducts: 5,
        approvedProducts: 24,
        rejectedProducts: 8,
        pendingReviews: 3,
        approvedReviews: 12,
        rejectedReviews: 4,
        pendingReports: 2,
        totalStores: MOCK_STORES.length,
      });
    }
    return api.get('/admin/stats');
  },

  getPendingReports: () => {
    if (USE_MOCK) return mockResponse([]);
    return api.get<ApiResponse<ProductReport[]>>('/admin/reports/pending');
  },

  getAllReports: () => {
    if (USE_MOCK) return mockResponse([]);
    return api.get<ApiResponse<ProductReport[]>>('/admin/reports');
  },

  resolveReport: (id: string) => {
    if (USE_MOCK) return mockResponse({ _id: id, status: 'resolved' as const } as ProductReport);
    return api.patch<ApiResponse<ProductReport>>(`/admin/reports/${id}/resolve`);
  },

  ignoreReport: (id: string) => {
    if (USE_MOCK) return mockResponse({});
    return api.delete<ApiResponse<{}>>(`/admin/reports/${id}/ignore`);
  },

  addStore: (data: { name: string; address: string; lat: number; lng: number; image: string | File; peakHours?: string; offPeakHours?: string }) => {
    if (USE_MOCK) {
      const store: Store = {
        _id: `store-${Date.now()}`,
        name: data.name,
        address: data.address,
        location: { lat: data.lat, lng: data.lng },
        image: typeof data.image === 'string' ? data.image : 'https://placehold.co/400x400?text=Mock',
        peakHours: data.peakHours || '',
        offPeakHours: data.offPeakHours || '',
        rating: 0,
        reviewCount: 0,
        lastCrowdLevel: 'low'
      };
      return mockResponse(store);
    }

    const formData = new FormData();
    // TEXT FIELDS FIRST
    formData.append('name', data.name);
    formData.append('address', data.address);
    formData.append('lat', data.lat.toString());
    formData.append('lng', data.lng.toString());
    if (data.peakHours) formData.append('peakHours', data.peakHours);
    if (data.offPeakHours) formData.append('offPeakHours', data.offPeakHours);

    // FILE LAST
    if (data.image) formData.append('image', data.image);

    return api.post<ApiResponse<Store>>('/admin/stores', formData);
  },

  getAllStores: () => {
    if (USE_MOCK) return mockResponse(MOCK_STORES);
    return api.get<ApiResponse<Store[]>>('/stores');
  },

  deleteStore: (id: string) => {
    if (USE_MOCK) return mockResponse({ _id: id });
    return api.delete<ApiResponse<{}>>(`/admin/stores/${id}`);
  },
};

export default api;
