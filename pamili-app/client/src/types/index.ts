// ============================================================
// PAMILI - Shared TypeScript Types
// These interfaces match your MongoDB schema / Express API
// ============================================================

export interface Product {
  _id: string;
  name: string;
  category: string;
  image: string;
  prices: PriceEntry[];
  priceHistory?: PriceHistoryEntry[];
  rating: number;
  reviewCount: number;
}

export interface PriceEntry {
  storeId: string;
  storeName: string;
  price: number;
  lastUpdated: string;
  inStock: boolean;
}

export interface PriceHistoryEntry {
  date: string;
  price: number;
}

export interface Store {
  _id: string;
  name: string;
  location: { lat: number; lng: number };
  address: string;
  rating: number;
  reviewCount: number;
  crowdLevel: 'low' | 'medium' | 'high';
  peakHours: string[];
  offPeakHours: string[];
  image: string;
  categories: string[];
}

export interface CartItem {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Review {
  _id: string;
  storeId: string;
  userName: string;
  rating: number;
  date: string;
  text: string;
  images?: string[];
  storeResponse?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface PendingProduct {
  _id: string;
  name: string;
  category: string;
  storeName: string;
  storeId: string;
  price: number;
  submittedBy: string;
  submittedDate: string;
  image?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
