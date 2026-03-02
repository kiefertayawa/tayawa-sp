// ============================================================
// PAMILI - Root App Component
// React Router v6 setup + Global Providers
// ============================================================

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import ShoppingCart from './components/features/cart/ShoppingCart';
import SubmitProductForm from './components/features/product/SubmitProductForm';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';

function AppLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCartClick={() => setCartOpen(true)}
        onSubmitClick={() => setSubmitOpen(true)}
      />

      <main className="pt-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/store/:id" element={<StorePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

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
          <AppLayout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
