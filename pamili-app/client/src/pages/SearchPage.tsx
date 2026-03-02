import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, Users, ShoppingCart, Store,
  TrendingDown, SlidersHorizontal, ChevronDown, X, Clock,
} from 'lucide-react';
import { useProductSearch, useStores } from '../hooks';
import { useCart } from '../context/CartContext';
import { HEADER_HEIGHT } from '../components/layout/Header';
import type { Product, Store as StoreType } from '../types';
import SearchMap from '../components/maps/SearchMap';

// ─── crowd badge config (matches Store.crowdLevel) ────────────
const crowdCfg: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: '#16a34a', bg: '#dcfce7', label: 'Low Traffic' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moderate Traffic' },
  high: { color: '#dc2626', bg: '#fee2e2', label: 'Busy' },
};

// ─── filter / sort state ──────────────────────────────────────
interface Filters {
  crowdLevels: Set<'low' | 'medium' | 'high'>;
  openNow: boolean;
  sortBy: 'price-asc' | 'price-desc' | 'rating';
}
const DEFAULT: Filters = { crowdLevels: new Set(), openNow: false, sortBy: 'price-asc' };

const sortLabels: Record<Filters['sortBy'], string> = {
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'rating': 'Highest Rated',
};

// ─── open-now helper ──────────────────────────────────────────
function parseMin(s: string) {
  const m = s.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return -1;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}
function isOpenNow(store: StoreType) {
  const cur = new Date().getHours() * 60 + new Date().getMinutes();
  const slots = [...store.peakHours, ...store.offPeakHours];
  if (!slots.length) return true;
  return slots.some(slot => {
    const [a, b] = slot.split(/\s*[–\-]\s*/);
    const s = parseMin(a), e = parseMin(b);
    return s >= 0 && e >= 0 && cur >= s && cur <= e;
  });
}

// ══════════════════════════════════════════════════════════════
export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const { results, loading, search } = useProductSearch();
  const { stores: allStores } = useStores();
  const { addItem } = useCart();

  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [showPanel, setShowPanel] = useState(false);
  const [highlightedStoreId, setHighlightedStoreId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Refs to each store card so we can scroll to them
  const storeCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const resultsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (query) search(query); }, [query]); // eslint-disable-line

  // close filter panel on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
        setShowPanel(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // When a map pin is clicked: highlight + scroll to the store card
  const handlePinClick = useCallback((storeId: string) => {
    setHighlightedStoreId(storeId);
    const card = storeCardRefs.current[storeId];
    if (card && resultsScrollRef.current) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Clear highlight after 2 s
    setTimeout(() => setHighlightedStoreId(prev => prev === storeId ? null : prev), 2000);
  }, []);

  // build store lookup
  const storeMap = new Map(allStores.map(s => [s._id, s]));

  // group products by store
  type Group = { storeId: string; storeName: string; storeData?: StoreType; products: { product: Product; price: number; inStock: boolean }[] };
  const raw: Record<string, Group> = {};
  results.forEach(product =>
    product.prices.forEach(p => {
      if (!raw[p.storeId]) raw[p.storeId] = { storeId: p.storeId, storeName: p.storeName, storeData: storeMap.get(p.storeId), products: [] };
      raw[p.storeId].products.push({ product, price: p.price, inStock: p.inStock });
    }),
  );

  // lowest price per product
  const lowestPrice: Record<string, number> = {};
  results.forEach(p => { lowestPrice[p._id] = Math.min(...p.prices.map(x => x.price)); });

  // apply filters + sort
  const groups = Object.values(raw)
    .filter(g => {
      const s = g.storeData;
      if (!s) return true;
      if (filters.crowdLevels.size > 0 && !filters.crowdLevels.has(s.crowdLevel as any)) return false;
      if (filters.openNow && !isOpenNow(s)) return false;
      return true;
    })
    .map(g => ({ ...g, products: [...g.products].sort((a, b) => filters.sortBy === 'price-asc' ? a.price - b.price : filters.sortBy === 'price-desc' ? b.price - a.price : b.product.rating - a.product.rating) }))
    .sort((a, b) => filters.sortBy === 'rating' ? (b.storeData?.rating ?? 0) - (a.storeData?.rating ?? 0) : 0);

  const totalProducts = results.length;
  const storeCount = groups.length;
  const activeCnt = filters.crowdLevels.size + (filters.openNow ? 1 : 0);

  const toggleCrowd = (lvl: 'low' | 'medium' | 'high') =>
    setFilters(prev => { const s = new Set(prev.crowdLevels); s.has(lvl) ? s.delete(lvl) : s.add(lvl); return { ...prev, crowdLevels: s }; });

  // ── Heights ────────────────────────────────────────────────
  // "Back to Map" bar: 44px (matches screenshot gap)
  const backBarH = 44;
  // Available for the two panels
  const panelsH = `calc(100vh - ${HEADER_HEIGHT}px - ${backBarH}px)`;
  // Map panel is square: width = panelsH, capped at 48vw
  const mapW = `min(${panelsH}, 48vw)`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        overflow: 'hidden',
        backgroundColor: '#f5f6fa',
        padding: '12px',          /* creates breathing room so the card floats */
      }}
    >
      {/* ── Rounded card wrapping both panels ─────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
        }}
      >
        {/* ══════════════════════════════════════════════════════
          ROW 1 — "Back to Map" standalone bar (white, full-width)
          This is OUTSIDE the two panels — matches screenshot exactly
          ══════════════════════════════════════════════════════ */}
        <div
          style={{
            height: `${backBarH}px`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 22px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e9eaec',
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, fontSize: '0.875rem', fontWeight: 500,
              color: '#374151',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16, strokeWidth: 2 }} />
            Back to Map
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
          ROW 2 — Two panels (map | results) — exact height fill
          ══════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── LEFT: square map panel ──────────────────────── */}
          <div
            style={{
              width: mapW,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRight: '1px solid #e5e7eb',
              backgroundColor: '#f0f2f5',  // light gray outer wrapper (matches screenshot)
            }}
          >
            {/* White top section: search info (above the gray map block) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '14px 20px 14px',
                flexShrink: 0,
                borderBottom: '1px solid #e9eaec',
              }}
            >
              <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', margin: '0 0 2px' }}>
                Search: &quot;{query}&quot;
              </p>
              <p style={{ fontSize: '0.8rem', color: '#8B1538', margin: 0, fontWeight: 500 }}>
                {storeCount} store{storeCount !== 1 ? 's' : ''} with matching products
              </p>
            </div>

            {/* Real Google Map */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <SearchMap
                pins={groups.filter(g => g.storeData).map(g => ({
                  store: g.storeData!,
                  price: Math.min(...g.products.map(p => p.price))
                }))}
                onStoreClick={handlePinClick}
                highlightedStoreId={highlightedStoreId}
              />
            </div>

            {/* Crowd legend bottom */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '10px 16px 12px',
                flexShrink: 0,
                borderTop: '1px solid #e9eaec',
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  display: 'inline-flex', alignItems: 'center', gap: '12px',
                  padding: '6px 14px', borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.72rem', color: '#6b7280',
                }}
              >
                <span style={{ fontWeight: 600 }}>Crowd Level:</span>
                {[{ l: 'Low', c: '#16a34a' }, { l: 'Moderate', c: '#d97706' }, { l: 'Busy', c: '#dc2626' }].map(({ l, c }) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c }} />
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: results panel ─────────────────────────── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              minWidth: 0,
            }}
          >
            {/* Sticky toolbar */}
            <div
              ref={panelRef}
              style={{
                padding: '14px 22px 12px',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: '#fff',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                  Results ({totalProducts} product{totalProducts !== 1 ? 's' : ''})
                </span>

                {/* Single Filters button */}
                <button
                  onClick={() => setShowPanel(v => !v)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '7px 15px', fontSize: '0.85rem',
                    border: `1.5px solid ${showPanel || activeCnt > 0 ? '#8B1538' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    backgroundColor: showPanel || activeCnt > 0 ? '#fdf2f5' : '#fff',
                    color: activeCnt > 0 ? '#8B1538' : '#374151',
                    cursor: 'pointer',
                    fontWeight: activeCnt > 0 ? 600 : 400,
                  }}
                >
                  <SlidersHorizontal style={{ width: 14, height: 14 }} />
                  Filters{activeCnt > 0 ? ` (${activeCnt})` : ''}
                  <ChevronDown style={{ width: 13, height: 13, transform: showPanel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>

              {/* Active chips */}
              {(activeCnt > 0 || filters.sortBy !== 'price-asc') && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {filters.sortBy !== 'price-asc' && (
                    <Chip label={sortLabels[filters.sortBy]} color="#374151" bg="#f3f4f6" onRemove={() => setFilters(p => ({ ...p, sortBy: 'price-asc' }))} />
                  )}
                  {Array.from(filters.crowdLevels).map(lvl => (
                    <Chip key={lvl} label={crowdCfg[lvl].label} color={crowdCfg[lvl].color} bg={crowdCfg[lvl].bg} onRemove={() => toggleCrowd(lvl)} />
                  ))}
                  {filters.openNow && (
                    <Chip label="Open Now" color="#2563eb" bg="#eff6ff" onRemove={() => setFilters(p => ({ ...p, openNow: false }))} />
                  )}
                </div>
              )}

              {/* Filters dropdown */}
              {showPanel && (
                <FiltersPanel
                  filters={filters}
                  setFilters={setFilters}
                  toggleCrowd={toggleCrowd}
                  onApply={() => setShowPanel(false)}
                />
              )}
            </div>

            {/* ── ONLY THIS SCROLLS ── */}
            <div ref={resultsScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 24px' }}>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} style={{ height: 190, backgroundColor: '#f3f4f6', borderRadius: 14, marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))
              ) : groups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 20px', color: '#9ca3af' }}>
                  <SlidersHorizontal style={{ width: 36, height: 36, color: '#e5e7eb', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>No results found</p>
                  <p style={{ fontSize: '0.83rem' }}>
                    {activeCnt > 0 ? 'Try adjusting your filters' : `No products matching "${query}"`}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {groups.map(({ storeId, storeName, storeData, products }) => {
                    const crowd = crowdCfg[storeData?.crowdLevel ?? 'medium'];
                    return (
                      <div
                        key={storeId}
                        ref={el => { storeCardRefs.current[storeId] = el; }}
                        style={{
                          backgroundColor: '#fff',
                          border: highlightedStoreId === storeId ? '2px solid #8B1538' : '1px solid #e5e7eb',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          boxShadow: highlightedStoreId === storeId ? '0 0 0 3px rgba(139,21,56,0.12)' : 'none',
                          transition: 'border 0.2s, box-shadow 0.2s',
                        }}
                      >
                        {/* Store header */}
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MapPin style={{ width: 15, height: 15, color: '#8B1538', flexShrink: 0 }} />
                              <div>
                                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', margin: 0 }}>{storeName}</p>
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '2px 0 0' }}>{storeData?.address ?? '—'}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.73rem', fontWeight: 700, color: crowd.color, backgroundColor: crowd.bg, borderRadius: '999px', padding: '3px 10px' }}>
                                <Users style={{ width: 10, height: 10 }} />{crowd.label}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>
                                <Star style={{ width: 13, height: 13, fill: '#facc15', color: '#facc15' }} />
                                {storeData?.rating?.toFixed(1) ?? '—'}
                              </span>
                            </div>
                          </div>
                          {storeData?.peakHours?.length ? (
                            <p style={{ fontSize: '0.79rem', color: '#6b7280', margin: 0, fontWeight: 500 }}>
                              Peak: {storeData.peakHours[0]}
                            </p>
                          ) : null}
                        </div>

                        {/* Product rows */}
                        {products.map(({ product, price, inStock }) => {
                          const isLowest = price === lowestPrice[product._id] && product.prices.length > 1;
                          const diff = price - lowestPrice[product._id];
                          return (
                            <div key={`${storeId}-${product._id}`} style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '18px 20px', borderTop: '1px solid #f9fafb' }}>
                              <img src={product.image} alt={product.name} style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: '6px' }}>{product.name}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '7px' }}>
                                  <span style={{ fontSize: '0.73rem', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 9px' }}>{product.category}</span>
                                  {isLowest && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.73rem', fontWeight: 700, color: '#fff', backgroundColor: '#16a34a', borderRadius: '999px', padding: '2px 9px' }}>
                                      <TrendingDown style={{ width: 10, height: 10 }} /> Lowest Price
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Star style={{ width: 12, height: 12, fill: '#facc15', color: '#facc15' }} />
                                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{product.rating}</span>
                                  <span style={{ fontSize: '0.73rem', fontWeight: 600, color: inStock ? '#16a34a' : '#9ca3af', backgroundColor: inStock ? '#f0fdf4' : '#f3f4f6', borderRadius: '4px', padding: '2px 8px' }}>
                                    {inStock ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#8B1538', margin: '0 0 2px' }}>₱{price.toFixed(2)}</p>
                                {!isLowest && diff > 0 && <p style={{ fontSize: '0.74rem', color: '#ef4444', margin: '0 0 6px' }}>+₱{diff.toFixed(2)}</p>}
                                <div style={{ display: 'flex', gap: '7px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                  <button onClick={() => navigate(`/store/${storeId}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', fontSize: '0.78rem', border: '1px solid #e5e7eb', borderRadius: '7px', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}>
                                    <Store style={{ width: 12, height: 12 }} /> View Store
                                  </button>
                                  <button
                                    disabled={!inStock}
                                    onClick={() => inStock && addItem({ productId: product._id, productName: product.name, storeId, storeName, price, image: product.image })}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700, border: 'none', borderRadius: '7px', backgroundColor: inStock ? '#8B1538' : '#e5e7eb', color: inStock ? '#fff' : '#9ca3af', cursor: inStock ? 'pointer' : 'not-allowed' }}
                                  >
                                    <ShoppingCart style={{ width: 12, height: 12 }} /> Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>   {/* end right panel */}
        </div>       {/* end two-panel row */}
      </div>         {/* end rounded card */}
    </div>

  );
}


// ── Small helpers extracted for readability ───────────────────

function Chip({ label, color, bg, onRemove }: { label: string; color: string; bg: string; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color, backgroundColor: bg, borderRadius: '999px', padding: '5px 13px' }}>
      {label}
      <X style={{ width: 12, height: 12, cursor: 'pointer', flexShrink: 0 }} onClick={onRemove} />
    </span>
  );
}

function FiltersPanel({ filters, setFilters, toggleCrowd, onApply }: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  toggleCrowd: (lvl: 'low' | 'medium' | 'high') => void;
  onApply: () => void;
}) {
  return (
    <div
      style={{
        position: 'absolute', top: 'calc(100% + 2px)', right: 22, zIndex: 60,
        backgroundColor: '#fff', border: '1px solid #e5e7eb',
        borderRadius: '14px', boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
        width: '290px', padding: '20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>Filters</span>
        <button onClick={() => setFilters({ crowdLevels: new Set(), openNow: false, sortBy: 'price-asc' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#8B1538', fontWeight: 600 }}>
          Reset all
        </button>
      </div>

      <SectionLabel>Crowd Level</SectionLabel>
      {(['low', 'medium', 'high'] as const).map(lvl => (
        <FilterRow key={lvl}>
          <input type="checkbox" checked={filters.crowdLevels.has(lvl)} onChange={() => toggleCrowd(lvl)} style={{ width: 15, height: 15, accentColor: '#8B1538', cursor: 'pointer', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: { low: '#16a34a', medium: '#d97706', high: '#dc2626' }[lvl] }} />
            {{ low: 'Low Traffic', medium: 'Moderate Traffic', high: 'Busy' }[lvl]}
          </div>
        </FilterRow>
      ))}

      <FilterRow style={{ justifyContent: 'space-between', padding: '12px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock style={{ width: 14, height: 14, color: '#6b7280' }} />
          Show only stores open now
        </div>
        <div onClick={() => setFilters(p => ({ ...p, openNow: !p.openNow }))} style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: filters.openNow ? '#8B1538' : '#d1d5db', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', top: 2, left: filters.openNow ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
        </div>
      </FilterRow>

      <SectionLabel style={{ marginTop: '14px' }}>Sort By</SectionLabel>
      <FilterRow>
        <input type="radio" name="sort" checked={filters.sortBy === 'rating'} onChange={() => setFilters(p => ({ ...p, sortBy: 'rating' }))} style={{ accentColor: '#8B1538', cursor: 'pointer' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Star style={{ width: 13, height: 13, fill: '#facc15', color: '#facc15' }} /> Highest Rated
        </span>
      </FilterRow>

      <SectionLabel style={{ marginTop: '14px' }}>Price</SectionLabel>
      {(['price-asc', 'price-desc'] as const).map(opt => (
        <FilterRow key={opt}>
          <input type="radio" name="sort" checked={filters.sortBy === opt} onChange={() => setFilters(p => ({ ...p, sortBy: opt }))} style={{ accentColor: '#8B1538', cursor: 'pointer' }} />
          {{ 'price-asc': 'Low to High', 'price-desc': 'High to Low' }[opt]}
        </FilterRow>
      ))}

      <button onClick={onApply} style={{ marginTop: '16px', width: '100%', padding: '11px', fontSize: '0.875rem', fontWeight: 600, color: '#fff', backgroundColor: '#8B1538', border: 'none', borderRadius: '9px', cursor: 'pointer' }}>
        Apply
      </button>
    </div>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: '0.73rem', fontWeight: 700, color: '#374151', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em', ...style }}>{children}</p>;
}

function FilterRow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #f9fafb', ...style }}>{children}</label>;
}
