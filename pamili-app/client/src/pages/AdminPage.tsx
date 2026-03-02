import { useState } from 'react';
import { CheckCircle, Star, Package, LogIn, LogOut } from 'lucide-react';
import { usePendingItems } from '../hooks';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { isAdmin, login, logout } = useAuth();
  const [tab, setTab] = useState<'products' | 'reviews'>('products');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const { pendingProducts, pendingReviews, loading, approveProduct, rejectProduct, approveReview, rejectReview } = usePendingItems();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (!ok) setLoginError('Invalid credentials');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc', paddingTop: '56px' }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full p-8" style={{ maxWidth: '360px' }}>
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#fdf2f5' }}>
              <LogIn className="w-6 h-6" style={{ color: '#8B1538' }} />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-sm text-gray-400 mt-1">PAMILI Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="text" required placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none" />
            <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none" />
            {loginError && <p className="text-xs text-red-500">{loginError}</p>}
            <button type="submit" className="w-full py-2.5 text-white text-sm font-semibold rounded-xl" style={{ backgroundColor: '#8B1538' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  const acceptedCount = 0;
  const rejectedCount = 0;

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Admin Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-6" style={{ height: '56px' }}>
        <div className="flex items-center gap-1.5">
          <svg className="w-5 h-5" style={{ color: '#8B1538' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xl font-bold" style={{ color: '#8B1538' }}>PAMILI</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
          style={{ backgroundColor: '#8B1538' }}
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="mx-auto px-6 py-8" style={{ maxWidth: '1400px', paddingTop: '80px' }}>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending Products', value: pendingProducts.length, color: '#8B1538' },
            { label: 'Pending Reviews', value: pendingReviews.length, color: '#8B1538' },
            { label: 'Accepted Entries', value: acceptedCount, color: '#16a34a' },
            { label: 'Rejected Entries', value: rejectedCount, color: '#dc2626' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-2">{stat.label}</p>
              <p className="text-4xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Tabs — pill style inside gray bar */}
          <div className="p-1 flex gap-1" style={{ backgroundColor: '#f3f4f6' }}>
            <button
              onClick={() => setTab('products')}
              className="flex-1 py-3 text-sm font-semibold rounded-lg transition-all"
              style={tab === 'products'
                ? { backgroundColor: '#fff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#6b7280', backgroundColor: 'transparent' }}
            >
              Products ({pendingProducts.length})
            </button>
            <button
              onClick={() => setTab('reviews')}
              className="flex-1 py-3 text-sm font-semibold rounded-lg transition-all"
              style={tab === 'reviews'
                ? { backgroundColor: '#fff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#6b7280', backgroundColor: 'transparent' }}
            >
              Reviews ({pendingReviews.length})
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : tab === 'products' ? (
            pendingProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No pending products</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Image', 'Product Name', 'Store', 'Price', 'Submitted By', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left text-sm font-semibold text-gray-700 px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingProducts.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        {p.image
                          ? <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                          : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>
                        }
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-800">{p.name}</td>
                      <td className="px-5 py-4 text-sm font-medium" style={{ color: '#0d9488' }}>{p.storeName}</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: '#8B1538' }}>₱{p.price.toFixed(2)}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{p.submittedBy}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{p.submittedDate}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveProduct(p._id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-md"
                            style={{ backgroundColor: '#16a34a' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectProduct(p._id)}
                            className="px-3 py-1.5 text-xs font-semibold border rounded-md"
                            style={{ color: '#dc2626', borderColor: '#dc2626', backgroundColor: 'transparent' }}
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
              <div className="text-center py-16 text-gray-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No pending reviews</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['User', 'Rating', 'Review', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left text-sm font-semibold text-gray-700 px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingReviews.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm font-medium text-gray-800">{r.userName}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">{r.text}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{r.date}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveReview(r._id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-md"
                            style={{ backgroundColor: '#16a34a' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectReview(r._id)}
                            className="px-3 py-1.5 text-xs font-semibold border rounded-md"
                            style={{ color: '#dc2626', borderColor: '#dc2626', backgroundColor: 'transparent' }}
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
