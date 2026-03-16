// ============================================================
// PAMILI - API Service Layer
// Wired to the real backend.
// Ensure VITE_API_URL is set to your Express server URL.
// ============================================================

import type { Product, Store, Review, ProductReport, ApiResponse } from '../types';
import axios from 'axios';

const PROD_URL = import.meta.env.VITE_API_URL || 'https://pamili-server.onrender.com/api';
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
    return api.get<ApiResponse<Product[]>>(`/products/search?q=${encodeURIComponent(query)}`);
  },

  getAll: () => {
    return api.get<ApiResponse<Product[]>>('/products');
  },

  getById: (id: string) => {
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
    return api.get<ApiResponse<string[]>>(`/products/suggestions?q=${encodeURIComponent(query)}`);
  },

  report: (productId: string, data: { storeId: string; reason: string }) => {
    return api.post<ApiResponse<ProductReport>>(`/products/${productId}/report`, data);
  },
};

// ─── Stores ───────────────────────────────────────────────────

export const storeService = {
  getAll: () => {
    return api.get<ApiResponse<Store[]>>('/stores');
  },

  getById: (id: string) => {
    return api.get<ApiResponse<Store>>(`/stores/${id}`);
  },

  getProducts: (storeId: string) => {
    return api.get<ApiResponse<Product[]>>(`/stores/${storeId}/products`);
  },
};

// ─── Reviews ──────────────────────────────────────────────────

export const reviewService = {
  getByStore: (storeId: string) => {
    return api.get<ApiResponse<Review[]>>(`/reviews?storeId=${storeId}`);
  },

  submit: (data: { storeId: string; rating: number; text: string; images?: (string | File)[] }) => {
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
    return api.get<ApiResponse<Product[]>>('/admin/products/pending');
  },

  getAllProducts: (page = 1, limit = 10) => {
    return api.get<ApiResponse<Product[]>>(`/admin/products?page=${page}&limit=${limit}`);
  },

  approveProduct: (id: string) => {
    return api.patch<ApiResponse<Product>>(`/admin/products/${id}/approve`);
  },

  rejectProduct: (id: string) => {
    return api.patch<ApiResponse<Product>>(`/admin/products/${id}/reject`);
  },

  deleteProduct: (id: string) => {
    return api.delete<ApiResponse<{}>>(`/admin/products/${id}`);
  },

  getPendingReviews: (page = 1, limit = 10) => {
    return api.get<ApiResponse<Review[]>>(`/admin/reviews/pending?page=${page}&limit=${limit}`);
  },

  approveReview: (id: string) => {
    return api.patch<ApiResponse<Review>>(`/admin/reviews/${id}/approve`);
  },

  rejectReview: (id: string) => {
    return api.patch<ApiResponse<Review>>(`/admin/reviews/${id}/reject`);
  },

  login: (credentials: { username: string; password: string }) => {
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
    return api.get('/admin/stats');
  },

  getPendingReports: () => {
    return api.get<ApiResponse<ProductReport[]>>('/admin/reports/pending');
  },

  getAllReports: (page = 1, limit = 10) => {
    return api.get<ApiResponse<ProductReport[]>>(`/admin/reports?page=${page}&limit=${limit}`);
  },

  resolveReport: (id: string) => {
    return api.patch<ApiResponse<ProductReport>>(`/admin/reports/${id}/resolve`);
  },

  ignoreReport: (id: string) => {
    return api.delete<ApiResponse<{}>>(`/admin/reports/${id}/ignore`);
  },

  addStore: (data: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    image: string | File;
    operatingHours: string;
    peakHours?: string;
    offPeakHours?: string
  }) => {
    const formData = new FormData();
    // TEXT FIELDS FIRST
    formData.append('name', data.name);
    formData.append('address', data.address);
    formData.append('lat', data.lat.toString());
    formData.append('lng', data.lng.toString());
    if (data.operatingHours) formData.append('operatingHours', data.operatingHours);
    if (data.peakHours) formData.append('peakHours', data.peakHours);
    if (data.offPeakHours) formData.append('offPeakHours', data.offPeakHours);

    // FILE LAST
    if (data.image) formData.append('image', data.image);

    return api.post<ApiResponse<Store>>('/admin/stores', formData);
  },

  getAllStores: (page = 1, limit = 10) => {
    return api.get<ApiResponse<Store[]>>(`/admin/stores?page=${page}&limit=${limit}`);
  },

  deleteStore: (id: string) => {
    return api.delete<ApiResponse<{}>>(`/admin/stores/${id}`);
  },
};

export default api;
