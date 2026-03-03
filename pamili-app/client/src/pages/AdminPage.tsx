import { useState } from 'react';
import { Star, Package, LogIn, Eye, EyeOff, CheckCircle, X, User } from 'lucide-react';
import { toast } from 'sonner';
import { usePendingItems } from '../hooks';
import { useAuth } from '../context/AuthContext';

// Helper to format as "Mar 3, 2026"
const formatShortDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function AdminPage() {
  const { isAdmin, login } = useAuth();
  const [tab, setTab] = useState<'products' | 'reviews'>('products');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'product' | 'review';
    action: 'approve' | 'reject';
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
    pendingProducts, pendingReviews, stats, loading,
    approveProduct, rejectProduct, approveReview, rejectReview,
  } = usePendingItems();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (!ok) setLoginError('Invalid credentials. Try admin / adminpabili');
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
              <LogIn style={{ width: 24, height: 24, color: '#8B1538' }} />
            </div>
            <h1 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: '4px' }}>Admin Login</h1>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>PAMILI Dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="text" required placeholder="Username"
              value={username} onChange={e => setUsername(e.target.value)}
              style={{
                display: 'block', width: '100%', marginBottom: '12px',
                padding: '11px 14px', fontSize: '0.875rem',
                border: '1.5px solid #e5e7eb', borderRadius: '10px',
                backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {/* Password field with show/hide toggle */}
            <div style={{ position: 'relative', marginBottom: loginError ? '8px' : '16px' }}>
              <input
                type={showPassword ? 'text' : 'password'} required placeholder="Password"
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
            {loginError && (
              <p style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: '12px' }}>{loginError}</p>
            )}
            <button
              type="submit"
              style={{
                width: '100%', padding: '12px',
                fontSize: '0.875rem', fontWeight: 600,
                color: '#fff', backgroundColor: '#8B1538',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
              }}
            >
              Login
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

        {/* ── Stat cards ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
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
            {(['products', 'reviews'] as const).map(t => (
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
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                        {p.name}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#0d9488', fontWeight: 500 }}>
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
                    {['User', 'Rating', 'Review', 'Date', 'Actions'].map(h => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left', padding: '12px 18px',
                          fontSize: '0.8rem', fontWeight: 700,
                          color: '#374151',
                        }}
                      >
                        {h}
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
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>Anonymous User</td>
                      <td style={{ padding: '14px 18px' }}>
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
                          padding: '14px 18px', fontSize: '0.875rem', color: '#6b7280',
                          maxWidth: '320px',
                        }}
                      >
                        <div style={{ transition: 'opacity 0.2s' }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: r.images?.length ? '8px' : '0' }}>
                            {r.text}
                          </span>
                          {r.images && r.images.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {r.images.map((img, i) => (
                                <img
                                  key={i} src={img} alt="Preview"
                                  style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #e5e7eb' }}
                                  onError={(e) => e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image+Available'}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#6b7280' }}>{formatShortDate(r.date)}</td>
                      <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
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
      {confirmModal.show && (
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
              Confirm Rejection
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>
              Are you sure you want to reject the {confirmModal.type} <strong>{confirmModal.name}</strong>?
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
                Go Back
              </button>
              <button
                onClick={executeConfirmedAction}
                style={{
                  flex: 1, padding: '12px', fontSize: '0.875rem', fontWeight: 600,
                  color: '#fff', backgroundColor: '#dc2626', border: 'none',
                  borderRadius: '10px', cursor: 'pointer',
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Review Content Detail Modal ── */}
      {viewReviewModal.show && viewReviewModal.review && (
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
                <p style={{ fontSize: '1rem', color: '#374151', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {viewReviewModal.review.text}
                </p>
              </div>

              {viewReviewModal.review.images && viewReviewModal.review.images.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Attached Photos</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {viewReviewModal.review.images.map((img: string, i: number) => (
                      <img
                        key={i} src={img} alt="Full view"
                        style={{ width: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#fafafa' }}
                        onError={(e) => e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image+Available'}
                      />
                    ))}
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
      )}

      {/* ── Product Content Detail Modal ── */}
      {viewProductModal.show && viewProductModal.product && (
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
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>{viewProductModal.product.name}</h4>

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
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.025em', margin: '0 0 4px' }}>Submitted By</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', margin: 0 }}>Anonymous User</p>
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
    </div>
  );
}
