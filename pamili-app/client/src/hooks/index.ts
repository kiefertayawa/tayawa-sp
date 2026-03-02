// ============================================================
// PAMILI - Custom Hooks
// Encapsulate all data-fetching logic. Swap mock for real API
// by uncommenting the api service calls.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Product, Store, Review, PendingProduct } from '../types';
import { productService, storeService, reviewService, adminService } from '../services/api';

// ─── Stores ───────────────────────────────────────────────
export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    storeService.getAll()
      .then((res) => setStores(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { stores, loading, error };
}

export function useStore(id: string | undefined) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    storeService.getById(id)
      .then((res) => setStore(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  return { store, loading };
}

// ─── Products ─────────────────────────────────────────────
export function useProductSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    try {
      const res = await productService.search(q);
      setResults(res.data.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, query, search };
}

export function useStoreProducts(storeId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    storeService.getProducts(storeId)
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
  }, [storeId]);

  return { products, loading };
}

// ─── Reviews ──────────────────────────────────────────────
export function useReviews(storeId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    reviewService.getByStore(storeId)
      .then((res) => setReviews(res.data.data))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const submitReview = async (data: { rating: number; text: string }) => {
    if (!storeId) return false;
    try {
      await reviewService.submit({ storeId, ...data });
      load(); // refresh reviews
      return true;
    } catch {
      return false;
    }
  };

  return { reviews, loading, submitReview };
}

// ─── Admin ────────────────────────────────────────────────
export function usePendingItems() {
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, revRes] = await Promise.all([
        adminService.getPendingProducts(),
        adminService.getPendingReviews(),
      ]);
      setPendingProducts(prodRes.data.data);
      setPendingReviews(revRes.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approveProduct = async (id: string) => {
    await adminService.approveProduct(id);
    setPendingProducts((p) => p.filter((x) => x._id !== id));
  };

  const rejectProduct = async (id: string) => {
    await adminService.rejectProduct(id);
    setPendingProducts((p) => p.filter((x) => x._id !== id));
  };

  const approveReview = async (id: string) => {
    await adminService.approveReview(id);
    setPendingReviews((r) => r.filter((x) => x._id !== id));
  };

  const rejectReview = async (id: string) => {
    await adminService.rejectReview(id);
    setPendingReviews((r) => r.filter((x) => x._id !== id));
  };

  return {
    pendingProducts,
    pendingReviews,
    loading,
    approveProduct,
    rejectProduct,
    approveReview,
    rejectReview,
  };
}
