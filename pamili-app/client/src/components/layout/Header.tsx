import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Upload, LogOut, X } from 'lucide-react';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/api';

interface HeaderProps {
  onCartClick: () => void;
  onSubmitClick: () => void;
}

const H = 68; // header height in px

export default function Header({ onCartClick, onSubmitClick }: HeaderProps) {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1); // keyboard nav index
  const { totalItems } = useCart();
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isAdminRoute = location.pathname.startsWith('/admin');

  // ── Fetch suggestions with 200ms debounce ─────────────────────
  // How it works:
  //   1. Every keystroke clears the previous timer and sets a new 200ms one.
  //   2. After 200ms of no typing, we hit GET /api/products/suggestions?q=...
  //   3. The server does a case-insensitive regex on approved product names,
  //      returns up to 8 matching *names* (strings only — no full documents).
  //   4. We render them in a dropdown. Clicking or pressing Enter navigates
  //      to /search?q=<suggestion> immediately.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = searchInput.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await productService.getSuggestions(q);
        setSuggestions(res.data.data);
        setShowSuggestions(res.data.data.length > 0);
        setActiveSuggestion(-1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  // ── Close dropdown when clicking outside ──────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchInput('');
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchInput);
  };

  // ── Keyboard navigation in dropdown ───────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      doSearch(suggestions[activeSuggestion]);
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
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
      }}
    >
      {/* Col 1 — Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/pamili-logo.png"
            alt="PAMILI"
            style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>
      </div>

      {/* Col 2 — Search bar with autocomplete (hidden on /admin) */}
      {!isAdminRoute ? (
        <div ref={wrapperRef} style={{ width: '560px', position: 'relative' }}>
          <form onSubmit={handleSearch}>
            <div style={{ position: 'relative' }}>
              <Search
                style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af', width: 16, height: 16, pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search for products (e.g., rice, eggs, notebooks)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: searchInput ? '36px' : '16px',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  fontSize: '0.875rem',
                  border: `1.5px solid ${showSuggestions ? '#8B1538' : '#e5e7eb'}`,
                  borderRadius: showSuggestions ? '10px 10px 0 0' : '10px',
                  backgroundColor: '#f9fafb',
                  outline: 'none',
                  color: '#374151',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
              />
              {/* Clear button */}
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSuggestions([]); setShowSuggestions(false); }}
                  style={{
                    position: 'absolute', right: '10px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0,
                  }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
          </form>

          {/* ── Suggestions dropdown ────────────────────────────── */}
          {showSuggestions && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '1.5px solid #8B1538',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                zIndex: 200,
                overflow: 'hidden',
              }}
            >
              {suggestions.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); doSearch(name); }}
                  onMouseEnter={() => setActiveSuggestion(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 14px',
                    background: activeSuggestion === idx ? '#fdf2f5' : 'transparent',
                    border: 'none',
                    borderBottom: idx < suggestions.length - 1 ? '1px solid #f9fafb' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: activeSuggestion === idx ? '#8B1538' : '#374151',
                    fontWeight: activeSuggestion === idx ? 600 : 400,
                    transition: 'background 0.1s',
                  }}
                >
                  <Search style={{ width: 13, height: 13, flexShrink: 0, color: '#9ca3af' }} />
                  {/* Highlight the matching part */}
                  {highlightMatch(name, searchInput)}
                </button>
              ))}
              <div
                style={{
                  padding: '8px 14px',
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  borderTop: '1px solid #f3f4f6',
                  backgroundColor: '#fafafa',
                }}
              >
                Press <kbd style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1px 5px', fontSize: '0.7rem' }}>Enter</kbd> to search all results
              </div>
            </div>
          )}
        </div>
      ) : (
        <div />
      )}

      {/* Col 3 — Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
        {!isAdminRoute && (
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
        )}

        {isAdmin && isAdminRoute && (
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
        )}
      </div>
    </header>
  );
}

// ── Bold the matched substring inside a suggestion label ──────────
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <strong style={{ color: '#8B1538' }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </span>
  );
}

export { H as HEADER_HEIGHT };
