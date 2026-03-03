import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Upload, LogOut } from 'lucide-react';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onCartClick: () => void;
  onSubmitClick: () => void;
}

const H = 68; // header height in px

export default function Header({ onCartClick, onSubmitClick }: HeaderProps) {
  const [searchInput, setSearchInput] = useState('');
  const { totalItems } = useCart();
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // On the /admin route, show only the logo — no user-facing controls
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput('');
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: `${H}px`,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 100,
        display: 'grid',
        // 3-column grid: logo | search | actions
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
      }}
    >
      {/* Col 1 — Logo (left-aligned) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/pamili-logo.png"
            alt="PAMILI"
            style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>
      </div>

      {/* Col 2 — Search bar (hidden on /admin login) */}
      {!isAdminRoute ? (
        <form onSubmit={handleSearch} style={{ width: '560px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                width: 16,
                height: 16,
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search for products (e.g., rice, eggs, notebooks)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: '16px',
                paddingTop: '9px',
                paddingBottom: '9px',
                fontSize: '0.875rem',
                border: '1.5px solid #e5e7eb',
                borderRadius: '10px',
                backgroundColor: '#f9fafb',
                outline: 'none',
                color: '#374151',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </form>
      ) : (
        <div /> /* empty centre col */
      )}

      {/* Col 3 — Actions (hidden on /admin login, Logout when authenticated admin) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
        {isAdmin ? (
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px',
              fontSize: '0.875rem', fontWeight: 600,
              color: '#ffffff', backgroundColor: '#8B1538',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
            }}
          >
            <LogOut style={{ width: 16, height: 16 }} /> Logout
          </button>
        ) : !isAdminRoute ? (
          <>
            <button
              onClick={onSubmitClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 18px',
                fontSize: '0.875rem', fontWeight: 600,
                color: '#ffffff', backgroundColor: '#8B1538',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
              }}
            >
              <Upload style={{ width: 16, height: 16 }} /> Add Product
            </button>

            <button
              onClick={onCartClick}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px',
                fontSize: '0.875rem', fontWeight: 500,
                color: '#374151', backgroundColor: 'transparent',
                border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer',
              }}
            >
              <ShoppingCart style={{ width: 17, height: 17 }} /> List
              {totalItems > 0 && (
                <span
                  style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    backgroundColor: '#8B1538', color: '#fff',
                    fontSize: '0.68rem', fontWeight: 700,
                    borderRadius: '9999px', minWidth: '20px', height: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          </>
        ) : null /* /admin login: no actions shown */}
      </div>
    </header>
  );
}

export { H as HEADER_HEIGHT };
