import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, MapPin, Upload, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onCartClick: () => void;
  onSubmitClick: () => void;
}

export default function Header({ onCartClick, onSubmitClick }: HeaderProps) {
  const [searchInput, setSearchInput] = useState('');
  const { totalItems } = useCart();
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput('');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50" style={{height:'56px'}}>
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-1.5 flex-shrink-0 hover:opacity-80 transition-opacity">
          <MapPin className="w-5 h-5" style={{color:'#8B1538'}} />
          <span className="text-xl font-bold" style={{color:'#8B1538'}}>PAMILI</span>
        </Link>

        {!isAdmin && (
          <form onSubmit={handleSearch} className="flex-1" style={{maxWidth:'580px'}}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products (e.g., rice, eggs, notebooks)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
              />
            </div>
          </form>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin ? (
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{backgroundColor:'#8B1538'}}>
              <LogOut className="w-4 h-4" /> Logout
            </button>
          ) : (
            <>
              <button onClick={onSubmitClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{backgroundColor:'#8B1538'}}>
                <Upload className="w-4 h-4" /> Add Product
              </button>
              <button onClick={onCartClick} className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                <ShoppingCart className="w-4 h-4" /> Cart
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold" style={{backgroundColor:'#8B1538'}}>
                    {totalItems}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
