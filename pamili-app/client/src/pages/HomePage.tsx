import { useNavigate } from 'react-router-dom';
import { Star, Users } from 'lucide-react';
import { useStores } from '../hooks';
import type { Store } from '../types';
import HomeMap from '../components/maps/HomeMap';

const crowdConfig = {
  low: { color: '#16a34a', bg: '#dcfce7', label: 'Low Traffic' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moderate Traffic' },
  high: { color: '#dc2626', bg: '#fee2e2', label: 'Busy' },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { stores, loading } = useStores();

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Google Map */}
        <div
          style={{
            marginBottom: '32px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            height: '560px',
          }}
        >
          <HomeMap stores={stores} height="560px" />
        </div>

        {/* Store grid */}
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
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {stores.map((store) => (
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
  );
}

function StoreCard({ store, onClick }: { store: Store; onClick: () => void }) {
  const crowd = crowdConfig[store.crowdLevel] ?? crowdConfig.low;

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
        <p style={{ fontSize: '0.82rem', color: '#0d9488', margin: '0 0 8px' }}>
          {store.address}
        </p>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '12px' }}>
          <Star style={{ width: 15, height: 15, fill: '#facc15', color: '#facc15' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{store.rating}</span>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>({store.reviewCount})</span>
        </div>

        {/* Peak hours */}
        {store.peakHours.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '6px', fontWeight: 500 }}>
              Peak Hours:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {store.peakHours.map(h => (
                <span
                  key={h}
                  style={{
                    fontSize: '0.75rem', fontWeight: 500,
                    color: '#374151', backgroundColor: '#e5e7eb',
                    borderRadius: '6px', padding: '3px 10px',
                    border: '1px solid #d1d5db',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
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
