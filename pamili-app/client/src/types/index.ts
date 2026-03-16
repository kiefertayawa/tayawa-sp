// ============================================================
// PAMILI - Shared TypeScript Types
// These interfaces match your MongoDB schema / Express API
// ============================================================

export interface Product {
  _id: string;
  name: string;
  image: string;
  prices: PriceEntry[];
  priceHistory?: PriceHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
  status?: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  submittedDate?: string;
  crowdLevel?: 'low' | 'medium' | 'high' | 'not_sure';
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
  peakHours: string;
  offPeakHours: string;
  operatingHours: string;
  image: string;
  lastCrowdLevel?: 'low' | 'medium' | 'high' | 'not_sure';
  lastCrowdTime?: string;
  createdAt?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  price: number;
  quantity: number;
  image: string;
  selected?: boolean;
}

export interface Review {
  _id: string;
  storeId: string;
  userName: string;
  rating: number;
  date: string;
  text: string;
  images?: {
    url: string;
    publicId: string;
  }[];
  storeResponse?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface ProductReport {
  _id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'ignored';
  submittedDate: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
