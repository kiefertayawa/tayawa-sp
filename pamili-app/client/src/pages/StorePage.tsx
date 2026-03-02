import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Users, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore, useStoreProducts, useReviews } from '../hooks';
import { useCart } from '../context/CartContext';
import ReviewsSection from '../components/features/store/ReviewsSection';

const crowdConfig = {
  low:    { color: '#16a34a', bg: '#dcfce7', label: 'Low Traffic' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moderate Traffic' },
  high:   { color: '#dc2626', bg: '#fee2e2', label: 'Busy' },
};

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { store, loading } = useStore(id);
  const { products } = useStoreProducts(id);
  const { addItem } = useCart();

  if (loading) return <div className="pt-14 p-8"><div className="animate-pulse space-y-4"><div className="h-64 bg-gray-100 rounded" /><div className="h-8 bg-gray-100 rounded w-64" /></div></div>;
  if (!store) return null;

  const crowd = crowdConfig[store.crowdLevel] ?? crowdConfig.low;

  return (
    <div style={{backgroundColor:'#f8fafc', minHeight:'100vh', paddingTop:'56px'}}>
      {/* Banner Image */}
      <div className="relative w-full" style={{height:'280px'}}>
        <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
      </div>

      <div className="mx-auto px-6 py-6" style={{maxWidth:'1400px'}}>
        {/* Back */}
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Map
        </button>

        {/* Store Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h1 className="text-xl font-bold mb-1" style={{color:'#8B1538'}}>{store.name}</h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <MapPin className="w-4 h-4" /> {store.address}
          </div>
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-800">{store.rating}</span>
            <span className="text-gray-400 text-sm">({store.reviewCount} reviews)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {store.categories.map(c => (
              <span key={c} className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-full">{c}</span>
            ))}
          </div>
        </div>

        {/* Crowd Insights */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-800">Crowd Insights</h2>
          </div>
          <div className="mb-3">
            <span className="text-sm text-gray-500 mr-2">Current Status:</span>
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{color: crowd.color, backgroundColor: crowd.bg}}>
              {crowd.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-5">Help the community! Share your shopping experience by leaving a review below.</p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Peak Hours (Busy Times)</span>
              </div>
              {store.peakHours.map(h => (
                <div key={h} className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> {h}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Off-Peak Hours (Best Times)</span>
              </div>
              {store.offPeakHours.map(h => (
                <div key={h} className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> {h}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products */}
        {products.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="font-semibold text-gray-800 mb-4">Available Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map(product => {
                const priceInfo = product.prices.find(p => p.storeId === id);
                if (!priceInfo) return null;
                return (
                  <div key={product._id} className="flex gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                      <p className="text-sm font-bold" style={{color:'#8B1538'}}>₱{priceInfo.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => addItem({ productId: product._id, productName: product.name, storeId: store._id, storeName: store.name, price: priceInfo.price, image: product.image })}
                      disabled={!priceInfo.inStock}
                      className="self-center p-2 text-white rounded-lg disabled:opacity-40"
                      style={{backgroundColor:'#8B1538'}}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        <ReviewsSection storeId={store._id} storeName={store.name} />
      </div>
    </div>
  );
}
