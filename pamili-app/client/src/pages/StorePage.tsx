import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../hooks';
import ReviewsSection from '../components/features/store/ReviewsSection';
import ProductsSection from '../components/features/store/ProductsSection';

const crowdConfig = {
  low: { color: '#16a34a', bg: '#dcfce7', label: 'Low' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moderate' },
  high: { color: '#dc2626', bg: '#fee2e2', label: 'Busy' },
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

function getLiveCrowdStatus(store: any): 'low' | 'medium' | 'high' {
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
    const sVal = parseMin(sStr), eVal = parseMin(eStr);
    if (sVal < 0 || eVal < 0) return false;
    if (sVal < eVal) return cur >= sVal && cur < eVal;
    return cur >= sVal || cur < eVal;
  };
  if (store.peakHours && isCurrent(store.peakHours)) return 'high';
  if (store.offPeakHours && isCurrent(store.offPeakHours)) return 'low';
  return 'medium';
}

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

  const status = getLiveCrowdStatus(store);
  const crowd = crowdConfig[status] ?? crowdConfig.medium;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <MapPin style={{ width: 15, height: 15, color: '#6b7280', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{store.address}</span>
          </div>

          {/* Operating Hours */}
          {store.operatingHours && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Clock style={{ width: 15, height: 15, color: '#6b7280', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Operating Hours: {store.operatingHours}</span>
            </div>
          )}

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Star style={{ width: 16, height: 16, fill: '#facc15', color: '#facc15' }} />
            <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{store.rating}</span>
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>({store.reviewCount} {store.reviewCount <= 1 ? 'review' : 'reviews'})</span>
          </div>

        </div>

        {/* Crowd Insights Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '16px' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <h2 style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem', margin: 0 }}>Crowd Insights</h2>
          </div>

          {/* Status + help text */}
          <div style={{ marginBottom: '14px' }}>
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

          {/* Peak / Off-peak columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Peak */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <TrendingUp style={{ width: 15, height: 15, color: '#ef4444' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Peak Hours (Busy Times)</span>
              </div>
              {store.peakHours ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Clock style={{ width: 13, height: 13, color: '#9ca3af' }} />
                  <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{store.peakHours}</span>
                </div>
              ) : (
                <span style={{ fontSize: '0.82rem', color: '#9ca3af', fontStyle: 'italic' }}>Not available</span>
              )}
            </div>

            {/* Off-peak */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <TrendingDown style={{ width: 15, height: 15, color: '#16a34a' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Off-Peak Hours (Best Times)</span>
              </div>
              {store.offPeakHours ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Clock style={{ width: 13, height: 13, color: '#9ca3af' }} />
                  <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{store.offPeakHours}</span>
                </div>
              ) : (
                <span style={{ fontSize: '0.82rem', color: '#9ca3af', fontStyle: 'italic' }}>Not available</span>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <ProductsSection storeId={store._id} />

        {/* Reviews */}
        <ReviewsSection storeId={store._id} storeName={store.name} helpText="Help the community! Share your shopping experience by leaving a review below." />
      </div>
    </div>
  );
}
