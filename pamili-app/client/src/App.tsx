// ============================================================
// PAMILI - Root App Component
// ============================================================

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Header, { HEADER_HEIGHT } from './components/layout/Header';
import ShoppingCart from './components/features/cart/ShoppingCart';
import SubmitProductForm from './components/features/product/SubmitProductForm';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';

function AppLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  // Lock page scroll when any overlay is open.
  // scrollbar-gutter:stable (set on html in index.css) prevents layout shift.
  useEffect(() => {
    const isOpen = cartOpen || submitOpen;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen, submitOpen]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
      <Header
        onCartClick={() => setCartOpen(true)}
        onSubmitClick={() => setSubmitOpen(true)}
      />

      <main style={{ paddingTop: `${HEADER_HEIGHT}px` }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/store/:id" element={<StorePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      {/* Overlays — outside main so z-index is clean */}
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <SubmitProductForm isOpen={submitOpen} onClose={() => setSubmitOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {/* Load Google Maps script ONCE here so all map components are instant */}
          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}
            loadingElement={<></>}  /* silent — pages render while maps load */
          >
            <AppLayout />
          </LoadScript>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
