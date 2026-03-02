import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../hooks';
import ReviewsSection from '../components/features/store/ReviewsSection';

const crowdConfig = {
  low: { color: '#16a34a', bg: '#dcfce7', label: 'Low Traffic' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moderate Traffic' },
  high: { color: '#dc2626', bg: '#fee2e2', label: 'Busy' },
};

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { store, loading } = useStore(id);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ height: 260, backgroundColor: '#e5e7eb', borderRadius: 12, marginBottom: 16, animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 24, backgroundColor: '#e5e7eb', borderRadius: 6, width: '40%', marginBottom: 12 }} />
        <div style={{ height: 16, backgroundColor: '#f3f4f6', borderRadius: 6, width: '60%' }} />
      </div>
    );
  }
  if (!store) return null;

  const crowd = crowdConfig[store.crowdLevel] ?? crowdConfig.low;

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh' }}>

      {/* Back to Map — above the banner */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px 0' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.875rem', color: '#6b7280',
            padding: '4px 0',
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back to Map
        </button>
      </div>

      {/* Banner Image */}
      <div style={{ maxWidth: '1200px', margin: '12px auto 0', padding: '0 24px' }}>
        <div style={{ borderRadius: '16px', overflow: 'hidden', height: '280px' }}>
          <img
            src={store.image}
            alt={store.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px 40px' }}>

        {/* Store Info Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '16px' }}>
          {/* Name */}
          <h1 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#8B1538', margin: '0 0 8px' }}>
            {store.name}
          </h1>

          {/* Address */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <MapPin style={{ width: 15, height: 15, color: '#6b7280', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{store.address}</span>
          </div>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <Star style={{ width: 16, height: 16, fill: '#facc15', color: '#facc15' }} />
            <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{store.rating}</span>
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>({store.reviewCount} reviews)</span>
          </div>

        </div>

        {/* Crowd Insights Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '16px' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Users style={{ width: 16, height: 16, color: '#6b7280' }} />
            <h2 style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem', margin: 0 }}>Crowd Insights</h2>
          </div>

          {/* Status + help text */}
          <div style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '8px' }}>Current Status:</span>
            <span
              style={{
                fontSize: '0.8rem', fontWeight: 600,
                color: crowd.color, backgroundColor: crowd.bg,
                borderRadius: '999px', padding: '3px 12px',
              }}
            >
              {crowd.label}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
            Help the community! Share your shopping experience by leaving a review below.
          </p>

          {/* Peak / Off-peak columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Peak */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <TrendingUp style={{ width: 15, height: 15, color: '#ef4444' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Peak Hours (Busy Times)</span>
              </div>
              {store.peakHours.map(h => (
                <div key={h} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Clock style={{ width: 13, height: 13, color: '#9ca3af' }} />
                  <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{h}</span>
                </div>
              ))}
            </div>

            {/* Off-peak */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <TrendingDown style={{ width: 15, height: 15, color: '#16a34a' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Off-Peak Hours (Best Times)</span>
              </div>
              {store.offPeakHours.map(h => (
                <div key={h} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Clock style={{ width: 13, height: 13, color: '#9ca3af' }} />
                  <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection storeId={store._id} storeName={store.name} />
      </div>
    </div>
  );
}
