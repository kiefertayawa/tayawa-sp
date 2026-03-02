import { useState } from 'react';
import { CheckCircle, Star, Package, LogIn, Eye, EyeOff } from 'lucide-react';
import { usePendingItems } from '../hooks';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { isAdmin, login } = useAuth();
  const [tab, setTab] = useState<'products' | 'reviews'>('products');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const {
    pendingProducts, pendingReviews, loading,
    approveProduct, rejectProduct, approveReview, rejectReview,
  } = usePendingItems();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (!ok) setLoginError('Invalid credentials. Try admin / admin123');
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
  const acceptedCount = 24;
  const rejectedCount = 8;

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 28px' }}>

        {/* ── Stat cards ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Pending Products', value: pendingProducts.length, color: '#8B1538' },
            { label: 'Pending Reviews', value: pendingReviews.length, color: '#8B1538' },
            { label: 'Accepted Entries', value: acceptedCount, color: '#16a34a' },
            { label: 'Rejected Entries', value: rejectedCount, color: '#dc2626' },
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
                      style={{
                        borderBottom: idx < pendingProducts.length - 1 ? '1px solid #f9fafb' : 'none',
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '8px' }} />
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
                        {p.storeName}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: 600, color: '#8B1538' }}>
                        ₱{p.price.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#6b7280' }}>
                        {p.submittedBy}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#6b7280' }}>
                        {p.submittedDate}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => approveProduct(p._id)}
                            style={{
                              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700,
                              color: '#fff', backgroundColor: '#16a34a',
                              border: 'none', borderRadius: '6px', cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectProduct(p._id)}
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
                      style={{ borderBottom: idx < pendingReviews.length - 1 ? '1px solid #f9fafb' : 'none' }}
                    >
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{r.userName}</td>
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
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#6b7280', maxWidth: '320px' }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {r.text}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#6b7280' }}>{r.date}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => approveReview(r._id)}
                            style={{
                              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700,
                              color: '#fff', backgroundColor: '#16a34a',
                              border: 'none', borderRadius: '6px', cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectReview(r._id)}
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
    </div>
  );
}
