// ============================================================
// PAMILI - Custom Hooks
// Encapsulate all data-fetching logic. Swap mock for real API
// by uncommenting the api service calls.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Product, Store, Review, ProductReport } from '../types';
import { productService, storeService, reviewService, adminService } from '../services/api';

// ─── Stores ───────────────────────────────────────────────
export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    storeService.getAll()
      .then((res) => setStores(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch on mount
  useEffect(() => { fetchStores(); }, [fetchStores]);

  // Sync: Refetch on focus, visibility change, or background timer
  useEffect(() => {
    const onFocus = () => fetchStores(true); // Pass true for silent
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    // Background polling (every 30s)
    const timer = setInterval(() => fetchStores(true), 30000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(timer);
    };
  }, [fetchStores]);

  return { stores, loading, error, refetch: fetchStores };
}

export function useStore(id: string | undefined) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStore = useCallback((silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    storeService.getById(id)
      .then((res) => setStore(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchStore(); }, [fetchStore]);

  useEffect(() => {
    const onFocus = () => fetchStore(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    const timer = setInterval(() => fetchStore(true), 30000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(timer);
    };
  }, [fetchStore]);

  return { store, loading, refetch: fetchStore };
}

// ─── Products ─────────────────────────────────────────────
export function useProductSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const search = useCallback(async (q: string, silent = false) => {
    if (!q.trim()) return;
    setQuery(q);
    if (!silent) setLoading(true);
    try {
      const res = await productService.search(q);
      setResults(res.data.data);
    } catch {
      setResults([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const refetch = useCallback((silent = false) => {
    if (query) search(query, silent);
  }, [query, search]);

  useEffect(() => {
    if (!query) return;
    const onFocus = () => refetch(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const timer = setInterval(() => refetch(true), 20000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(timer);
    };
  }, [query, refetch]);

  return { results, loading, query, search, refetch };
}

export function useStoreProducts(storeId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback((silent = false) => {
    if (!storeId) return;
    if (!silent) setLoading(true);
    storeService.getProducts(storeId)
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const onFocus = () => fetchProducts(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    const timer = setInterval(() => fetchProducts(true), 30000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(timer);
    };
  }, [fetchProducts]);

  return { products, loading, refetch: fetchProducts };
}

// ─── Reviews ──────────────────────────────────────────────
export function useReviews(storeId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback((silent = false) => {
    if (!storeId) return;
    if (!silent) setLoading(true);
    reviewService.getByStore(storeId)
      .then((res) => setReviews(res.data.data))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  useEffect(() => {
    const onFocus = () => fetchReviews(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    const timer = setInterval(() => fetchReviews(true), 20000); // Reviews might need more frequent sync

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(timer);
    };
  }, [fetchReviews]);

  const submitReview = async (data: { rating: number; text: string; images?: (string | File)[] }) => {
    if (!storeId) return false;
    try {
      await reviewService.submit({ storeId, ...data });
      return true;
    } catch {
      return false;
    }
  };

  return { reviews, loading, submitReview, refetch: fetchReviews };
}

// ─── Admin ────────────────────────────────────────────────
export function usePendingItems(isAdmin: boolean = true) {
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [stats, setStats] = useState({
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0,
    pendingReports: 0,
    totalStores: 0,
  });
  const [loading, setLoading] = useState(true);

  // Pagination Metadata
  const [pagination, setPagination] = useState({
    products: { page: 1, totalPages: 1, total: 0 },
    stores: { page: 1, totalPages: 1, total: 0 },
    reports: { page: 1, totalPages: 1, total: 0 },
    reviews: { page: 1, totalPages: 1, total: 0 },
  });

  const fetchProducts = useCallback(async (page = 1, silent = false) => {
    if (!isAdmin) return;
    if (!silent) setLoading(true);
    try {
      const res = await adminService.getAllProducts(page);
      setProducts(res.data.data);
      if (res.data.pagination) {
        setPagination(prev => ({ ...prev, products: res.data.pagination! }));
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchStores = useCallback(async (page = 1, silent = false) => {
    if (!isAdmin) return;
    if (!silent) setLoading(true);
    try {
      const res = await adminService.getAllStores(page);
      setStores(res.data.data);
      if (res.data.pagination) {
        setPagination(prev => ({ ...prev, stores: res.data.pagination! }));
      }
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchReports = useCallback(async (page = 1, silent = false) => {
    if (!isAdmin) return;
    if (!silent) setLoading(true);
    try {
      const res = await adminService.getAllReports(page);
      setReports(res.data.data);
      if (res.data.pagination) {
        setPagination(prev => ({ ...prev, reports: res.data.pagination! }));
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchReviews = useCallback(async (page = 1, silent = false) => {
    if (!isAdmin) return;
    if (!silent) setLoading(true);
    try {
      const res = await adminService.getPendingReviews(page);
      setPendingReviews(res.data.data);
      if (res.data.pagination) {
        setPagination(prev => ({ ...prev, reviews: res.data.pagination! }));
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await adminService.getStats();
      setStats({
        ...res.data.data,
        pendingReports: res.data.data.pendingReports || 0
      });
    } catch { }
  }, [isAdmin]);

  const loadAll = useCallback(async (silent = false) => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    await Promise.all([
      fetchProducts(pagination.products.page, true),
      fetchReviews(pagination.reviews.page, true),
      fetchStores(pagination.stores.page, true),
      fetchReports(pagination.reports.page, true),
      fetchStats()
    ]);
    setLoading(false);
  }, [isAdmin, fetchProducts, fetchReviews, fetchStores, fetchReports, fetchStats, pagination.products.page, pagination.reviews.page, pagination.stores.page, pagination.reports.page]);


  const approveProduct = async (id: string) => {
    try {
      await adminService.approveProduct(id);
      fetchProducts(pagination.products.page, true);
      fetchStats();
      return true;
    } catch { return false; }
  };

  const rejectProduct = async (id: string) => {
    try {
      await adminService.rejectProduct(id);
      fetchProducts(pagination.products.page, true);
      fetchStats();
      return true;
    } catch { return false; }
  };

  const deleteProduct = async (id: string) => {
    try {
      await adminService.deleteProduct(id);
      fetchProducts(pagination.products.page, true);
      fetchStats();
      return true;
    } catch { return false; }
  };

  const approveReview = async (id: string) => {
    try {
      await adminService.approveReview(id);
      fetchReviews(pagination.reviews.page, true);
      fetchStats();
      return true;
    } catch { return false; }
  };

  const rejectReview = async (id: string) => {
    try {
      await adminService.rejectReview(id);
      fetchReviews(pagination.reviews.page, true);
      fetchStats();
      return true;
    } catch { return false; }
  };

  const addStore = async (data: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    image: string | File;
    operatingHours: string;
    peakHours?: string;
    offPeakHours?: string
  }) => {
    try {
      await adminService.addStore(data);
      fetchStores(pagination.stores.page, true);
      fetchStats();
      return true;
    } catch { return false; }
  };

  const deleteStoreHook = async (id: string) => {
    try {
      await adminService.deleteStore(id);
      fetchStores(pagination.stores.page, true);
      fetchStats();
      return true;
    } catch { return false; }
  };

  const resolveReport = async (id: string) => {
    try {
      await adminService.resolveReport(id);
      fetchReports(pagination.reports.page, true);
      fetchStats();
      return true;
    } catch { return false; }
  };

  const ignoreReport = async (id: string) => {
    try {
      await adminService.ignoreReport(id);
      fetchReports(pagination.reports.page, true);
      fetchStats();
      return true;
    } catch { return false; }
  };

  useEffect(() => {
    const onFocus = () => loadAll(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    // Admin data needs aggressive polling
    const timer = setInterval(() => loadAll(true), 15000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(timer);
    };
  }, [loadAll]);

  return {
    products,
    pendingReviews,
    reports,
    stores,
    stats,
    loading,
    pagination,
    fetchProducts,
    fetchStores,
    fetchReviews,
    fetchReports,
    approveProduct,
    rejectProduct,
    deleteProduct,
    approveReview,
    rejectReview,
    resolveReport,
    ignoreReport,
    addStore,
    deleteStore: deleteStoreHook,
    refetch: loadAll
  };
}
