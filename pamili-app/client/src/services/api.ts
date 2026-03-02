// ============================================================
// PAMILI - API Service Layer
// All calls go through here. Swap mock data for real endpoints
// when your Express/Node backend is ready.
// ============================================================

import axios from 'axios';
import type { Product, Store, Review, PendingProduct, ApiResponse } from '../types';

// Set this to your Express server URL (e.g. http://localhost:5000/api)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // for JWT cookie auth
});

// Attach auth token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pamili_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Products ─────────────────────────────────────────────
export const productService = {
  search: (query: string) =>
    api.get<ApiResponse<Product[]>>(`/products/search?q=${encodeURIComponent(query)}`),

  getAll: () =>
    api.get<ApiResponse<Product[]>>('/products'),

  getById: (id: string) =>
    api.get<ApiResponse<Product>>(`/products/${id}`),

  submit: (data: FormData) =>
    api.post<ApiResponse<PendingProduct>>('/products/submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Stores ───────────────────────────────────────────────
export const storeService = {
  getAll: () =>
    api.get<ApiResponse<Store[]>>('/stores'),

  getById: (id: string) =>
    api.get<ApiResponse<Store>>(`/stores/${id}`),

  getProducts: (storeId: string) =>
    api.get<ApiResponse<Product[]>>(`/stores/${storeId}/products`),
};

// ─── Reviews ──────────────────────────────────────────────
export const reviewService = {
  getByStore: (storeId: string) =>
    api.get<ApiResponse<Review[]>>(`/reviews?storeId=${storeId}`),

  submit: (data: { storeId: string; rating: number; text: string }) =>
    api.post<ApiResponse<Review>>('/reviews', data),
};

// ─── Admin ────────────────────────────────────────────────
export const adminService = {
  getPendingProducts: () =>
    api.get<ApiResponse<PendingProduct[]>>('/admin/products/pending'),

  approveProduct: (id: string) =>
    api.patch<ApiResponse<PendingProduct>>(`/admin/products/${id}/approve`),

  rejectProduct: (id: string) =>
    api.patch<ApiResponse<PendingProduct>>(`/admin/products/${id}/reject`),

  getPendingReviews: () =>
    api.get<ApiResponse<Review[]>>('/admin/reviews/pending'),

  approveReview: (id: string) =>
    api.patch<ApiResponse<Review>>(`/admin/reviews/${id}/approve`),

  rejectReview: (id: string) =>
    api.patch<ApiResponse<Review>>(`/admin/reviews/${id}/reject`),

  login: (credentials: { username: string; password: string }) =>
    api.post<ApiResponse<{ token: string }>>('/admin/login', credentials),
};

export default api;
