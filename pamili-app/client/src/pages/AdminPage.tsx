import { useState, useEffect, useRef } from 'react';
import { Star, Package, Eye, EyeOff, CheckCircle, X, User, Plus, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { usePendingItems } from '../hooks';
import { useAuth } from '../context/AuthContext';

// Helper to format as "Mar 3, 2026"
const formatShortDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const crowdConfig = {
  low: { color: '#16a34a', bg: '#dcfce7', label: 'Low' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moderate' },
  high: { color: '#dc2626', bg: '#fee2e2', label: 'Busy' },
};

// Helper to format as "3/3/2026, 8:37:50 PM"
const formatFullDateTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
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

export default function AdminPage() {
  const { isAdmin, login } = useAuth();
  const [tab, setTab] = useState<'products' | 'reviews' | 'stores'>('products');
  const [showAddStore, setShowAddStore] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);


  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'product' | 'review' | 'store';
    action: 'approve' | 'reject' | 'delete';
    id: string;
    name: string;
  }>({ show: false, type: 'product', action: 'reject', id: '', name: '' });

  // Review Detail Modal State
  const [viewReviewModal, setViewReviewModal] = useState<{ show: boolean; review: any | null }>({ show: false, review: null });

  // Product Detail Modal State
  const [viewProductModal, setViewProductModal] = useState<{ show: boolean; product: any | null }>({ show: false, product: null });

  // Hover state for rows
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const {
    pendingProducts, pendingReviews, stores, stats, loading,
    approveProduct, rejectProduct, approveReview, rejectReview,
    addStore, deleteStore
  } = usePendingItems(isAdmin);

  // Scroll Lock for Modals
  useEffect(() => {
    const isModalOpen = showAddStore || confirmModal.show || viewReviewModal.show || viewProductModal.show;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddStore, confirmModal.show, viewReviewModal.show, viewProductModal.show]);

  // Clear fields on logout
  useEffect(() => {
    if (!isAdmin) {
      setUsername('');
      setPassword('');
    }
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please fill out all fields.');
      return;
    }
    setIsLoggingIn(true);
    const ok = await login(username, password);
    setIsLoggingIn(false);
    if (!ok) {
      toast.error('Login failed. Please check your credentials!');
    } else {
      toast.success('Successfully logged in as administrator!');
    }
  };

  const handleApproveProduct = async (id: string) => {
    const ok = await approveProduct(id);
    if (ok) toast.success('Product approved!');
    else toast.error('Failed to approve product.');
  };

  const handleRejectProduct = (id: string, name: string) => {
    setConfirmModal({ show: true, type: 'product', action: 'reject', id, name });
  };

  const handleApproveReview = async (id: string) => {
    const ok = await approveReview(id);
    if (ok) toast.success('Review approved!');
    else toast.error('Failed to approve review.');
  };

  const handleRejectReview = (id: string, name: string) => {
    setConfirmModal({ show: true, type: 'review', action: 'reject', id, name });
  };

  const handleDeleteStore = (id: string, name: string) => {
    setConfirmModal({ show: true, type: 'store', action: 'delete', id, name });
  };

  const handleOpenReviewDetail = (review: any) => {
    setViewReviewModal({ show: true, review });
  };

  const handleOpenProductDetail = (product: any) => {
    setViewProductModal({ show: true, product });
  };

  const executeConfirmedAction = async () => {
    const { type, action, id } = confirmModal;
    setConfirmModal(prev => ({ ...prev, show: false }));

    if (type === 'product' && action === 'reject') {
      const ok = await rejectProduct(id);
      if (ok) toast.success('Submission rejected.');
      else toast.error('Failed to reject submission.');
    } else if (type === 'review' && action === 'reject') {
      const ok = await rejectReview(id);
      if (ok) toast.success('Review rejected.');
      else toast.error('Failed to reject review.');
    } else if (type === 'store' && action === 'delete') {
      const ok = await deleteStore(id);
      if (ok) toast.success('Store deleted.');
      else toast.error('Failed to delete store.');
    }
  };

  // ── Login screen ──────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f6fa',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '24vh',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            width: '100%',
            maxWidth: '380px',
            padding: '40px 36px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: 52, height: 52,
                borderRadius: '14px',
                backgroundColor: '#fdf2f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <User style={{ width: 24, height: 24, color: '#8B1538' }} />
            </div>
            <h1 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: '4px' }}>Admin Login</h1>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="text" placeholder="Username"
              value={username} onChange={e => setUsername(e.target.value)}
              style={{
                display: 'block', width: '100%', marginBottom: '12px',
                padding: '11px 14px', fontSize: '0.875rem',
                border: '1.5px solid #e5e7eb', borderRadius: '10px',
                backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {/* Password field with show/hide toggle */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type={showPassword ? 'text' : 'password'} placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{
                  display: 'block', width: '100%',
                  padding: '11px 42px 11px 14px', fontSize: '0.875rem',
                  border: '1.5px solid #e5e7eb', borderRadius: '10px',
                  backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', top: '50%', right: '12px',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, color: '#9ca3af', display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword
                  ? <EyeOff style={{ width: 17, height: 17 }} />
                  : <Eye style={{ width: 17, height: 17 }} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%', padding: '12px',
                fontSize: '0.875rem', fontWeight: 600,
                color: '#fff', backgroundColor: '#8B1538',
                border: 'none', borderRadius: '10px',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                opacity: isLoggingIn ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {isLoggingIn ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Logging in...
                </>
              ) : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin dashboard ───────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8B1538', margin: 0 }}>Admin Dashboard</h1>
          <button
            onClick={() => setShowAddStore(true)}
            style={{
              padding: '10px 20px', fontSize: '0.875rem', fontWeight: 700,
              color: '#fff', backgroundColor: '#8B1538',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'opacity 0.2s'
            }}
          >
            <Plus style={{ width: 18, height: 18 }} />
            Add Store
          </button>
        </div>

        {/* ── Stat cards ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Stores', value: stats.totalStores || 0, color: '#16a34a' },
            { label: 'Pending Products', value: stats.pendingProducts, color: '#8B1538' },
            { label: 'Pending Reviews', value: stats.pendingReviews, color: '#8B1538' },
            { label: 'Accepted Entries', value: stats.approvedProducts + stats.approvedReviews, color: '#16a34a' },
            { label: 'Rejected Entries', value: stats.rejectedProducts + stats.rejectedReviews, color: '#dc2626' },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                backgroundColor: '#fff',
                borderRadius: '14px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                padding: '20px 22px',
              }}
            >
              <p style={{ fontSize: '0.83rem', color: '#6b7280', margin: '0 0 10px' }}>{stat.label}</p>
              <p style={{ fontSize: '2.4rem', fontWeight: 700, color: stat.color, margin: 0, lineHeight: 1 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Main panel ─────────────────────────────── */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '14px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Tab bar */}
          <div style={{ display: 'flex', padding: '6px', backgroundColor: '#f3f4f6', gap: '4px' }}>
            {(['products', 'stores', 'reviews'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '11px 16px',
                  fontSize: '0.875rem', fontWeight: 600,
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  transition: 'all 0.15s',
                  ...(tab === t
                    ? { backgroundColor: '#fff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { backgroundColor: 'transparent', color: '#9ca3af' }),
                }}
              >
                {t === 'products'
                  ? `Products (${pendingProducts.length})`
                  : t === 'stores'
                    ? `Stores (${stores.length})`
                    : `Reviews (${pendingReviews.length})`}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ padding: '32px' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ height: 64, backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 12 }} />
              ))}
            </div>
          ) : tab === 'products' ? (
            pendingProducts.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af' }}>
                <CheckCircle style={{ width: 40, height: 40, color: '#e5e7eb', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.875rem' }}>No pending products</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['Image', 'Product Name', 'Store', 'Price', 'Submitted By', 'Date', 'Actions'].map(h => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left', padding: '12px 18px',
                          fontSize: '0.8rem', fontWeight: 700,
                          color: '#374151', letterSpacing: '0.02em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingProducts.map((p, idx) => (
                    <tr
                      key={p._id}
                      onMouseEnter={() => setHoveredRow(p._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => handleOpenProductDetail(p)}
                      style={{
                        borderBottom: idx < pendingProducts.length - 1 ? '1px solid #f9fafb' : 'none',
                        backgroundColor: hoveredRow === p._id ? '#f9fafb' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image+Available')}
                          />
                        ) : (
                          <div style={{ width: 48, height: 48, backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package style={{ width: 20, height: 20, color: '#d1d5db' }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: 500, color: '#111827', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#111827', fontWeight: 500 }}>
                        {p.prices?.[0]?.storeName || 'Unknown'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: 600, color: '#8B1538' }}>
                        ₱{(p.prices?.[0]?.price || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#6b7280' }}>
                        Anonymous User
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#6b7280' }}>
                        {formatShortDate(p.submittedDate)}
                      </td>
                      <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApproveProduct(p._id)}
                            style={{
                              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700,
                              color: '#fff', backgroundColor: '#16a34a',
                              border: 'none', borderRadius: '6px', cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectProduct(p._id, p.name)}
                            style={{
                              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700,
                              color: '#dc2626', backgroundColor: '#fff',
                              border: '1.5px solid #dc2626', borderRadius: '6px', cursor: 'pointer',
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : tab === 'stores' ? (
            stores.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af' }}>
                <CheckCircle style={{ width: 40, height: 40, color: '#e5e7eb', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.875rem' }}>No stores available</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['Image', 'Store Name', 'Crowd Level', 'Rating', 'Date Created', 'Actions'].map(h => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left', padding: '12px 18px',
                          fontSize: '0.8rem', fontWeight: 700,
                          color: '#374151', letterSpacing: '0.02em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stores.map((s, idx) => (
                    <tr
                      key={s._id}
                      onMouseEnter={() => setHoveredRow(s._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: idx < stores.length - 1 ? '1px solid #f9fafb' : 'none',
                        backgroundColor: hoveredRow === s._id ? '#f9fafb' : 'transparent',
                        transition: 'background-color 0.2s',
                        cursor: 'default',
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={s.name}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image+Available')}
                          />
                        ) : (
                          <div style={{ width: 48, height: 48, backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package style={{ width: 20, height: 20, color: '#d1d5db' }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                        {s.name}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {(() => {
                          const status = getLiveCrowdStatus(s);
                          const config = crowdConfig[status];
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '0.72rem', fontWeight: 700,
                              color: config.color,
                              backgroundColor: config.bg,
                              borderRadius: '999px', padding: '3px 10px',
                            }}>
                              {config.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star style={{ width: 14, height: 14, fill: '#facc15', color: '#facc15' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{s.rating.toFixed(1)}</span>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>({s.reviewCount})</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#6b7280' }}>
                        {formatShortDate(s.createdAt)}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <button
                          onClick={() => handleDeleteStore(s._id, s.name)}
                          style={{
                            padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700,
                            color: '#dc2626', backgroundColor: '#fff',
                            border: '1.5px solid #dc2626', borderRadius: '6px', cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            pendingReviews.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af' }}>
                <CheckCircle style={{ width: 40, height: 40, color: '#e5e7eb', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.875rem' }}>No pending reviews</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {[
                      { l: 'Store', w: '22%' },
                      { l: 'Rating', w: '12%' },
                      { l: 'Review', w: '40%' },
                      { l: 'Date', w: '13%' },
                      { l: 'Actions', w: '13%' }
                    ].map(h => (
                      <th
                        key={h.l}
                        style={{
                          textAlign: 'left', padding: '16px 20px',
                          fontSize: '0.8rem', fontWeight: 700,
                          color: '#374151', width: h.w
                        }}
                      >
                        {h.l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingReviews.map((r, idx) => (
                    <tr
                      key={r._id}
                      onMouseEnter={() => setHoveredRow(r._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => handleOpenReviewDetail(r)}
                      style={{
                        borderBottom: idx < pendingReviews.length - 1 ? '1px solid #f9fafb' : 'none',
                        backgroundColor: hoveredRow === r._id ? '#f9fafb' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <td style={{ padding: '16px 20px', fontSize: '0.875rem', fontWeight: 500, color: '#111827', width: '22%' }}>
                        {stores.find(st => st._id === r.storeId)?.name ?? 'Unknown Store'}
                      </td>
                      <td style={{ padding: '16px 20px', width: '12%' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              style={{ width: 14, height: 14, fill: s <= r.rating ? '#facc15' : '#e5e7eb', color: s <= r.rating ? '#facc15' : '#e5e7eb' }}
                            />
                          ))}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '16px 20px', fontSize: '0.875rem', color: '#6b7280',
                          width: '40%',
                        }}
                      >
                        <div style={{ transition: 'opacity 0.2s' }}>
                          <span style={{
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden', marginBottom: r.images?.length ? '8px' : '0',
                            wordBreak: 'break-all'
                          }}>
                            {r.text}
                          </span>
                          {r.images && r.images.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {r.images.map((img: any, i: number) => {
                                const url = typeof img === 'string' ? img : img.url;
                                return (
                                  <img
                                    key={i} src={url} alt="Preview"
                                    style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #e5e7eb' }}
                                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image+Available')}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: '#6b7280', width: '13%' }}>{formatShortDate(r.date)}</td>
                      <td style={{ padding: '16px 20px', width: '13%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApproveReview(r._id)}
                            style={{
                              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700,
                              color: '#fff', backgroundColor: '#16a34a',
                              border: 'none', borderRadius: '6px', cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectReview(r._id, r.userName)}
                            style={{
                              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700,
                              color: '#dc2626', backgroundColor: '#fff',
                              border: '1.5px solid #dc2626', borderRadius: '6px', cursor: 'pointer',
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* ── Confirmation Modal ────────────────────────── */}
      {
        confirmModal.show && (
          <>
            <div
              onClick={() => setConfirmModal(p => ({ ...p, show: false }))}
              style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)', zIndex: 1000,
              }}
            />
            <div
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                backgroundColor: '#fff', borderRadius: '16px', padding: '28px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)', zIndex: 1001,
                width: '100%', maxWidth: '380px', textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  backgroundColor: '#fee2e2', color: '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <X style={{ width: 28, height: 28 }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                Confirm {confirmModal.action === 'delete' ? 'Deletion' : 'Rejection'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                {confirmModal.type === 'review'
                  ? "Are you sure you want to reject this review?"
                  : <>Are you sure you want to {confirmModal.action === 'delete' ? 'delete' : 'reject'} the {confirmModal.type} <strong style={{ wordBreak: 'break-all' }}>{confirmModal.name}</strong>?</>
                }
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setConfirmModal(p => ({ ...p, show: false }))}
                  style={{
                    flex: 1, padding: '12px', fontSize: '0.875rem', fontWeight: 600,
                    color: '#374151', backgroundColor: '#f3f4f6', border: 'none',
                    borderRadius: '10px', cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={executeConfirmedAction}
                  style={{
                    flex: 1, padding: '12px', fontSize: '0.875rem', fontWeight: 600,
                    color: '#fff', backgroundColor: '#dc2626', border: 'none',
                    borderRadius: '10px', cursor: 'pointer',
                  }}
                >
                  {confirmModal.action === 'delete' ? 'Delete' : 'Confirm'}
                </button>
              </div>
            </div>
          </>
        )
      }

      {/* ── Review Content Detail Modal ── */}
      {
        viewReviewModal.show && viewReviewModal.review && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 1100 }}
              onClick={() => setViewReviewModal({ show: false, review: null })}
            />
            <div
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                backgroundColor: '#fff', borderRadius: '20px', padding: '0',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', zIndex: 1101,
                width: '90%', maxWidth: '600px', maxHeight: '85vh',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Review Details</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Submitted on {formatFullDateTime(viewReviewModal.review.date)}</p>
                </div>
                <button
                  onClick={() => setViewReviewModal({ show: false, review: null })}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User style={{ width: 22, height: 22, color: '#9ca3af' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: '0 0 2px' }}>Anonymous User</p>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          style={{ width: 16, height: 16, fill: s <= viewReviewModal.review.rating ? '#facc15' : '#e5e7eb', color: s <= viewReviewModal.review.rating ? '#facc15' : '#e5e7eb' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f3f4f6', marginBottom: '24px' }}>
                  <p style={{ fontSize: '1rem', color: '#374151', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {viewReviewModal.review.text}
                  </p>
                </div>

                {viewReviewModal.review.images && viewReviewModal.review.images.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Attached Photos</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {viewReviewModal.review.images.map((img: any, i: number) => {
                        const url = typeof img === 'string' ? img : img.url;
                        return (
                          <img
                            key={i} src={url} alt="Full view"
                            style={{ width: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#fafafa' }}
                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image+Available')}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ padding: '24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '12px', justifyContent: 'flex-end', backgroundColor: '#fafafa' }}>
                <button
                  onClick={() => {
                    handleApproveReview(viewReviewModal.review._id);
                    setViewReviewModal({ show: false, review: null });
                  }}
                  style={{
                    padding: '10px 24px', fontSize: '0.875rem', fontWeight: 700,
                    color: '#fff', backgroundColor: '#16a34a',
                    border: 'none', borderRadius: '10px', cursor: 'pointer',
                    minWidth: '120px'
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    handleRejectReview(viewReviewModal.review._id, viewReviewModal.review.userName);
                    setViewReviewModal({ show: false, review: null });
                  }}
                  style={{
                    padding: '10px 24px', fontSize: '0.875rem', fontWeight: 700,
                    color: '#dc2626', backgroundColor: '#fff',
                    border: '1.5px solid #dc2626', borderRadius: '10px', cursor: 'pointer',
                    minWidth: '120px'
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </>
        )
      }

      {/* ── Product Content Detail Modal ── */}
      {
        viewProductModal.show && viewProductModal.product && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 1100 }}
              onClick={() => setViewProductModal({ show: false, product: null })}
            />
            <div
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                backgroundColor: '#fff', borderRadius: '20px', padding: '0',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', zIndex: 1101,
                width: '90%', maxWidth: '600px', maxHeight: '85vh',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Product Details</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Submitted on {formatFullDateTime(viewProductModal.product.submittedDate)}</p>
                </div>
                <button
                  onClick={() => setViewProductModal({ show: false, product: null })}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '16px', border: '1px solid #f3f4f6', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '0 0 16px', wordBreak: 'break-word' }}>{viewProductModal.product.name}</h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.025em', margin: '0 0 4px' }}>Store Location</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0d9488', margin: 0 }}>{viewProductModal.product.prices?.[0]?.storeName}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.025em', margin: '0 0 4px' }}>Current Price</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#8B1538', margin: 0 }}>₱{(viewProductModal.product.prices?.[0]?.price || 0).toFixed(2)}</p>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '4px 0 16px' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.025em', margin: '0 0 4px' }}>Submitted By</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', margin: 0 }}>Anonymous User</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.025em', margin: '0 0 4px' }}>Crowd Level reported</p>
                      <div style={{ marginTop: '2px' }}>
                        {(() => {
                          const lvl = viewProductModal.product.crowdLevel;
                          if (!lvl || lvl === 'not_sure') return <span style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>Not Sure</span>;
                          const config = crowdConfig[lvl as 'low' | 'medium' | 'high'];
                          if (!config) return <span style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>Not Sure</span>;
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '0.72rem', fontWeight: 700,
                              color: config.color,
                              backgroundColor: config.bg,
                              borderRadius: '999px', padding: '3px 10px',
                            }}>
                              <Users style={{ width: 12, height: 12 }} />
                              {config.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '12px', marginLeft: '4px' }}>Image</p>
                  <img
                    src={viewProductModal.product.image || 'https://placehold.co/400x400?text=No+Image'}
                    alt="Product Full"
                    style={{ width: '100%', borderRadius: '16px', border: '1px solid #e5e7eb', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#fafafa' }}
                    onError={(e) => e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image+Available'}
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ padding: '24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '12px', justifyContent: 'flex-end', backgroundColor: '#fafafa' }}>
                <button
                  onClick={() => {
                    handleApproveProduct(viewProductModal.product._id);
                    setViewProductModal({ show: false, product: null });
                  }}
                  style={{
                    padding: '10px 24px', fontSize: '0.875rem', fontWeight: 700,
                    color: '#fff', backgroundColor: '#16a34a',
                    border: 'none', borderRadius: '10px', cursor: 'pointer',
                    minWidth: '120px'
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    handleRejectProduct(viewProductModal.product._id, viewProductModal.product.name);
                    setViewProductModal({ show: false, product: null });
                  }}
                  style={{
                    padding: '10px 24px', fontSize: '0.875rem', fontWeight: 700,
                    color: '#dc2626', backgroundColor: '#fff',
                    border: '1.5px solid #dc2626', borderRadius: '10px', cursor: 'pointer',
                    minWidth: '120px'
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </>
        )}

      {/* ── Add Store Modal ── */}
      <AddStoreModal
        isOpen={showAddStore}
        onClose={() => setShowAddStore(false)}
        onAdd={addStore}
      />
    </div>
  );
}

// ── Supporting Components ───────────────────────────

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => Promise<boolean>;
}

function AddStoreModal({ isOpen, onClose, onAdd }: AddStoreModalProps) {
  const [form, setForm] = useState({ name: '', address: '', lat: '', lng: '', peakHours: '', offPeakHours: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const formatFileName = (name: string) => {
    if (name.length <= 20) return name;
    const extIndex = name.lastIndexOf('.');
    if (extIndex !== -1 && name.length - extIndex <= 5) {
      const ext = name.substring(extIndex);
      return name.substring(0, 15) + '...' + ext;
    }
    return name.substring(0, 17) + '...';
  };

  // Automatically pick current location on open
  useEffect(() => {
    if (isOpen) {
      // We purposefully do NOT auto-fill the store location with the user's 
      // current location to ensure the admin explicitly drops a pin.
      // The LocationPicker handles showing the user's blue dot separately.
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFieldErrors: Record<string, boolean> = {};

    if (!imageFile) newFieldErrors.imageFile = true;
    if (!form.name.trim()) newFieldErrors.name = true;
    if (!form.address.trim()) newFieldErrors.address = true;
    if (!form.lat) newFieldErrors.lat = true;
    if (!form.lng) newFieldErrors.lng = true;

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    const timeFormat = /^(1[0-2]|[1-9]):[0-5][0-9]-(1[0-2]|[1-9]):[0-5][0-9](AM|PM)$/;

    if (form.peakHours.trim() && !timeFormat.test(form.peakHours.trim())) {
      toast.error('Peak Hour must be in the format 9:00-10:00AM (12-hour, case-sensitive AM/PM)');
      return;
    }

    if (form.offPeakHours.trim() && !timeFormat.test(form.offPeakHours.trim())) {
      toast.error('Off-Peak Hour must be in the format 1:00-2:00PM (12-hour, case-sensitive AM/PM)');
      return;
    }

    if (form.peakHours.trim() && form.offPeakHours.trim() && form.peakHours.trim() === form.offPeakHours.trim()) {
      toast.error('Peak and Off-Peak hours cannot be the same time!');
      return;
    }

    setSubmitting(true);
    const ok = await onAdd({
      name: form.name.trim(),
      address: form.address.trim(),
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      image: imageFile as File,
      peakHours: form.peakHours.trim(),
      offPeakHours: form.offPeakHours.trim()
    });
    setSubmitting(false);
    if (ok) {
      toast.success('Store added successfully!');
      onClose();
      setForm({ name: '', address: '', lat: '', lng: '', peakHours: '', offPeakHours: '' });
      setImageFile(null);
      setPreviewUrl('');
      setFieldErrors({});
    } else {
      toast.error('Failed to add store.');
    }
  };

  const inputStyle = (field: string) => ({
    width: '100%', padding: '10px 14px', fontSize: '0.875rem',
    border: `1px solid ${fieldErrors[field] ? '#dc2626' : '#e5e7eb'}`,
    borderRadius: '10px', outline: 'none', boxSizing: 'border-box' as const,
    backgroundColor: fieldErrors[field] ? '#fef2f2' : '#f9fafb',
    transition: 'all 0.2s'
  });

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 1200 }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff', borderRadius: '20px', padding: '0',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', zIndex: 1201,
          width: '90%', maxWidth: '540px', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Add Store</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Create a new store location</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Image Upload */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Store Image <span style={{ color: '#8B1538' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{
                cursor: 'pointer',
                padding: '10px 18px',
                backgroundColor: '#fff',
                border: `1px solid ${fieldErrors.imageFile ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ fontFamily: 'inherit' }}>Choose File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                      setFieldErrors(prev => ({ ...prev, imageFile: false }));
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {imageFile ? formatFileName(imageFile.name) : 'No file chosen.'}
              </div>
            </div>
            {fieldErrors.imageFile && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>An image file is required!</p>}
            <div style={{ position: 'relative', marginTop: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', height: '140px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={previewUrl || 'https://placehold.co/400x400?text=No+Image+Available'}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=Invalid+Image+Link')}
              />
              {imageFile && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setPreviewUrl('');
                    setFieldErrors(prev => ({ ...prev, imageFile: true }));
                  }}
                  style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
          </div>

          {/* Store Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Store Name <span style={{ color: '#8B1538' }}>*</span>
            </label>
            <input
              type="text" value={form.name}
              onChange={e => {
                setForm({ ...form, name: e.target.value });
                if (e.target.value.trim()) setFieldErrors(prev => ({ ...prev, name: false }));
              }}
              placeholder="e.g. Savemore Market"
              style={inputStyle('name')}
            />
            {fieldErrors.name && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>This field is required!</p>}
          </div>

          {/* Address */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Address <span style={{ color: '#8B1538' }}>*</span>
            </label>
            <input
              type="text" value={form.address}
              onChange={e => {
                setForm({ ...form, address: e.target.value });
                if (e.target.value.trim()) setFieldErrors(prev => ({ ...prev, address: false }));
              }}
              placeholder="Store branch / full address"
              style={inputStyle('address')}
            />
            {fieldErrors.address && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>This field is required!</p>}
          </div>

          {/* Map Picker */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Location Pin <span style={{ color: '#8B1538' }}>*</span>
            </label>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 8px' }}>
              Click anywhere on the map to drop a pin for this store.
            </p>
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1.5px solid ${fieldErrors.lat ? '#dc2626' : '#e5e7eb'}`, height: '240px', position: 'relative' }}>
              <LocationPicker
                lat={form.lat ? parseFloat(form.lat) : null}
                lng={form.lng ? parseFloat(form.lng) : null}
                onPick={(lat: number, lng: number) => {
                  setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
                  setFieldErrors(prev => ({ ...prev, lat: false, lng: false }));
                }}
              />
            </div>
            {form.lat && form.lng && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '4px 10px' }}>
                  <MapPin style={{ width: 11, height: 11, display: 'inline', marginRight: 4 }} />
                  Lat: {parseFloat(form.lat).toFixed(6)}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '4px 10px' }}>
                  Lng: {parseFloat(form.lng).toFixed(6)}
                </span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, lat: '', lng: '' }))}
                  style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}
                >
                  Clear
                </button>
              </div>
            )}
            {fieldErrors.lat && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>Please click the map to pick a location!</p>}
          </div>

          {/* Peak / Off-Peak Hours */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Peak Hour (Optional)</label>
            <input
              type="text" value={form.peakHours}
              onChange={e => setForm({ ...form, peakHours: e.target.value })}
              placeholder="e.g. 9:00-10:00AM"
              style={inputStyle('peakHours')}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Off-Peak Hour (Optional)</label>
            <input
              type="text" value={form.offPeakHours}
              onChange={e => setForm({ ...form, offPeakHours: e.target.value })}
              placeholder="e.g. 1:00-2:00PM"
              style={inputStyle('offPeakHours')}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button" onClick={onClose}
              style={{ flex: 1, padding: '12px', fontSize: '0.875rem', fontWeight: 600, color: '#374151', backgroundColor: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              style={{
                flex: 1, padding: '12px', fontSize: '0.875rem', fontWeight: 700,
                color: '#fff', backgroundColor: '#8B1538', border: 'none', borderRadius: '10px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Adding Store...
                </>
              ) : 'Add Store'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}


// ── Map location picker ───────────────────────────────────────────────────
// A small Leaflet map centred on Batong Malake. Clicking anywhere drops a
// marker and fires onPick(lat, lng) so the form captures exact coordinates.
const BATONG_MALAKE: [number, number] = [14.1664, 121.2417];

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Maroon Icon for Store Pinning
const maroonIcon = new L.DivIcon({
  html: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.37258 18.6274 0 12 0ZM12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16Z" fill="#8B1538"/>
         </svg>`,
  className: 'custom-maroon-pin',
  iconSize: [24, 36],
  iconAnchor: [12, 36]
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function LocateControl({ onLocate }: { onLocate: (coords: [number, number]) => void }) {
  const map = useMap();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (btnRef.current) {
      L.DomEvent.disableClickPropagation(btnRef.current);
      L.DomEvent.disableScrollPropagation(btnRef.current);
    }
  }, []);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            onLocate(coords);

            // Fix: Check distance to current center to prevent "shake" if already there
            const center = map.getCenter();
            const dist = center.distanceTo(coords);
            const zoom = map.getZoom();

            if (dist > 5 || zoom !== 17) {
              map.flyTo(coords, 17, { animate: true, duration: 1.2 });
            }
          },
          (err) => {
            toast.error("Could not find your location: " + err.message);
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
      }}
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        backgroundColor: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      title="Find my location"
    >
      <MapPin style={{ width: 18, height: 18, color: '#8B1538' }} />
    </button>
  );
}

function LocationPicker({
  lat, lng, onPick,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  // Initial user position fetch for the blue circle
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  return (
    <MapContainer
      center={lat != null && lng != null ? [lat, lng] : BATONG_MALAKE}
      zoom={16}
      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />
      <ClickHandler onPick={onPick} />
      <LocateControl onLocate={setUserPos} />
      {userPos && (
        <CircleMarker
          center={userPos}
          radius={8}
          pathOptions={{
            fillColor: '#3b82f6',
            fillOpacity: 1,
            color: '#fff',
            weight: 2
          }}
        />
      )}
      {lat != null && lng != null && <Marker position={[lat, lng]} icon={maroonIcon} />}
    </MapContainer>
  );
}

