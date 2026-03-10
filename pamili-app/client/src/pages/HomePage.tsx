import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, ArrowUp, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Check } from 'lucide-react';
import { useStores } from '../hooks';
import type { Store } from '../types';
import HomeMap from '../components/maps/HomeMap';

const crowdConfig = {
  low: { color: '#16a34a', bg: '#dcfce7', label: 'Low' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moderate' },
  high: { color: '#dc2626', bg: '#fee2e2', label: 'Busy' },
};

interface Filters {
  crowdLevels: Set<'low' | 'medium' | 'high'>;
  sortBy: 'default' | 'rating';
}

const DEFAULT: Filters = {
  crowdLevels: new Set(),
  sortBy: 'default',
};

// ─── help determine status dynamically ──────────────────────
function parseMin(s: string) {
  const str = s.trim().toUpperCase().replace(/\s+/g, '');
  const m12 = str.match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = m12[2] ? parseInt(m12[2], 10) : 0;
    const ampm = m12[3];
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  }
  const m24 = str.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = m24[2] ? parseInt(m24[2], 10) : 0;
    if (h >= 0 && h < 24) return h * 60 + min;
  }
  return -1;
}

function getLiveCrowdStatus(store: Store): 'low' | 'medium' | 'high' {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();

  // 1. Reality Check (The Live Pulse)
  if (store.lastCrowdLevel && store.lastCrowdLevel !== 'not_sure' && store.lastCrowdTime) {
    const reportTime = new Date(store.lastCrowdTime);
    const diffInMinutes = (now.getTime() - reportTime.getTime()) / (1000 * 60);
    if (diffInMinutes >= 0 && diffInMinutes < 60) {
      return store.lastCrowdLevel as 'low' | 'medium' | 'high';
    }
  }

  // 2. Expectation Check (The Historical Pattern)
  const isCurrent = (slot: string) => {
    const parts = slot.split(/\s*[–\-\/tToO]+\s*/);
    if (parts.length < 2) return false;
    let sStr = parts[0].trim(), eStr = parts[1].trim();
    if (/[AP]M$/i.test(eStr) && !/[AP]M$/i.test(sStr)) {
      const suffix = eStr.slice(-2).toUpperCase();
      const endH = parseInt(eStr.split(':')[0], 10);
      const startH = parseInt(sStr.split(':')[0], 10);
      const sSuffix = (startH === 11 && endH === 12) ? (suffix === 'PM' ? 'AM' : 'PM') : suffix;
      sStr += sSuffix;
    }
    const s = parseMin(sStr), e = parseMin(eStr);
    if (s < 0 || e < 0) return false;
    if (s < e) return cur >= s && cur < e;
    return cur >= s || cur < e;
  };
  if (store.peakHours && isCurrent(store.peakHours)) return 'high';
  if (store.offPeakHours && isCurrent(store.offPeakHours)) return 'low';
  return 'medium';
}

export default function HomePage() {
  const navigate = useNavigate();
  const { stores, loading } = useStores();
  const [showScroll, setShowScroll] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleCrowd = (lvl: 'low' | 'medium' | 'high') => {
    const next = new Set(filters.crowdLevels);
    if (next.has(lvl)) next.delete(lvl);
    else next.add(lvl);
    setFilters({ ...filters, crowdLevels: next });
  };

  const filtered = stores
    .filter(s => filters.crowdLevels.size === 0 || filters.crowdLevels.has(getLiveCrowdStatus(s)))
    .sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });

  const activeCnt = (filters.crowdLevels.size) + (filters.sortBy !== 'default' ? 1 : 0);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Heading */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.55rem', color: '#8B1538', margin: '0 0 5px' }}>
            Stores in Batong Malake
          </h2>
          <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
            Compare prices and{' '}
            <span style={{ color: '#014421', fontWeight: 600 }}>find the best deals</span>
            {' '}near you!
          </p>
        </div>

        {/* Map — fully rounded card, crowd legend floats inside */}
        <div
          style={{
            marginBottom: '32px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            height: '560px',
            position: 'relative', // needed for the absolute overlay
          }}
        >
          <HomeMap stores={stores} height="560px" />

          {/* Crowd level legend — floating inside map, bottom-left */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 5,
              backgroundColor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(4px)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.78rem',
              color: '#374151',
            }}
          >
            <span style={{ fontWeight: 700 }}>Crowd Level:</span>
            {[
              { l: 'Low', c: '#16a34a' },
              { l: 'Moderate', c: '#d97706' },
              { l: 'Busy', c: '#dc2626' },
            ].map(({ l, c }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c }} />
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Panel — on the right, above the grid */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '10px',
              backgroundColor: activeCnt > 0 ? '#fdf2f5' : '#fff',
              border: `1px solid ${activeCnt > 0 ? '#8B1538' : '#e5e7eb'}`,
              color: '#374151', fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <SlidersHorizontal style={{ width: 16, height: 16, color: activeCnt > 0 ? '#8B1538' : '#6b7280' }} />
            Filters {activeCnt > 0 && `(${activeCnt})`}
            {showMenu ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
          </button>

          {showMenu && (
            <>
              <div
                onClick={() => setShowMenu(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 100 }}
              />
              <div
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  width: '280px', backgroundColor: '#fff', borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
                  border: '1px solid #e5e7eb', zIndex: 101, padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>Filters</span>
                  <button
                    onClick={() => { setFilters(DEFAULT); setShowMenu(false); }}
                    style={{ background: 'none', border: 'none', color: '#8B1538', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RotateCcw style={{ width: 12, height: 12 }} />
                    Reset all
                  </button>
                </div>

                {/* Crowd Levels */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827', letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>Crowd Level</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(['low', 'medium', 'high'] as const).map(lvl => (
                      <div
                        key={lvl}
                        onClick={() => toggleCrowd(lvl)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }}
                      >
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '4px',
                          border: `2px solid ${filters.crowdLevels.has(lvl) ? '#8B1538' : '#d1d5db'}`,
                          backgroundColor: filters.crowdLevels.has(lvl) ? '#8B1538' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s'
                        }}>
                          {filters.crowdLevels.has(lvl) && <Check style={{ width: 14, height: 14, color: '#fff' }} />}
                        </div>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: crowdConfig[lvl].color }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>{crowdConfig[lvl].label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827', letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>Sort By</p>
                  <div
                    onClick={() => setFilters({ ...filters, sortBy: filters.sortBy === 'rating' ? 'default' : 'rating' })}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: `2px solid ${filters.sortBy === 'rating' ? '#8B1538' : '#d1d5db'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {filters.sortBy === 'rating' && <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#8B1538' }} />}
                    </div>
                    <Star style={{ width: 14, height: 14, color: '#facc15', fill: '#facc15' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Highest Rated</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowMenu(false)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#8B1538', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </div>


        {/* Store results container */}
        <div style={{ minHeight: '800px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <div style={{ height: 200, backgroundColor: '#e5e7eb' }} />
                  <div style={{ padding: '16px' }}>
                    <div style={{ height: 16, backgroundColor: '#e5e7eb', borderRadius: 6, marginBottom: 10, width: '70%' }} />
                    <div style={{ height: 12, backgroundColor: '#f3f4f6', borderRadius: 6, marginBottom: 8, width: '50%' }} />
                    <div style={{ height: 12, backgroundColor: '#f3f4f6', borderRadius: 6, marginBottom: 16, width: '40%' }} />
                    <div style={{ height: 38, backgroundColor: '#e5e7eb', borderRadius: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 0',
              backgroundColor: '#fff',
              borderRadius: '20px',
              border: '1px dashed #d1d5db'
            }}>
              <SlidersHorizontal style={{ width: 64, height: 64, color: '#e5e7eb', marginBottom: '20px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#546e7a', margin: 0 }}>No results found</h3>
              <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginTop: '8px' }}>Try adjusting your filters to find more stores.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {filtered.map((store) => (
                <StoreCard
                  key={store._id}
                  store={store}
                  onClick={() => navigate(`/store/${store._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScroll && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#8B1538',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139,21,56,0.3)',
            zIndex: 1000,
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(139,21,56,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,21,56,0.3)';
          }}
        >
          <ArrowUp style={{ width: 24, height: 24, strokeWidth: 3 }} />
        </button>
      )}
    </div>
  );
}

function StoreCard({ store, onClick }: { store: Store; onClick: () => void }) {
  const status = getLiveCrowdStatus(store);
  const crowd = crowdConfig[status] ?? crowdConfig.medium;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        border: '1px solid #f0f0f0',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.08)')}
    >
      {/* Store image */}
      <div style={{ height: 200, overflow: 'hidden' }}>
        <img
          src={store.image}
          alt={store.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Card body */}
      <div style={{ padding: '16px' }}>

        {/* Name + crowd badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: 0, lineHeight: 1.3 }}>
            {store.name}
          </h3>
          <span
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '0.72rem', fontWeight: 600,
              color: crowd.color, backgroundColor: crowd.bg,
              borderRadius: '999px', padding: '3px 10px',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            <Users style={{ width: 11, height: 11 }} />
            {crowd.label}
          </span>
        </div>

        {/* Address — teal */}
        <p style={{ fontSize: '0.82rem', color: '#014421', margin: '0 0 8px' }}>
          {store.address}
        </p>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '12px' }}>
          <Star style={{ width: 15, height: 15, fill: '#facc15', color: '#facc15' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{store.rating}</span>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>({store.reviewCount} {store.reviewCount <= 1 ? 'review' : 'reviews'})</span>
        </div>

        {/* Shopping Hours */}
        {(store.peakHours || store.offPeakHours) && (
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {store.peakHours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>Peak Hours:</span>
                <span
                  style={{
                    fontSize: '0.75rem', fontWeight: 500,
                    color: '#374151', backgroundColor: '#e5e7eb',
                    borderRadius: '6px', padding: '3px 10px',
                    border: '1px solid #d1d5db',
                  }}
                >
                  {store.peakHours}
                </span>
              </div>
            )}
          </div>
        )}

        {/* View Store button */}
        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          style={{
            width: '100%',
            padding: '11px',
            fontSize: '0.9rem', fontWeight: 600,
            color: '#fff', backgroundColor: '#8B1538',
            border: 'none', borderRadius: '10px', cursor: 'pointer',
          }}
        >
          View Store
        </button>
      </div>
    </div>
  );
}
