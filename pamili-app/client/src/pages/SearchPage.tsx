import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Users, ShoppingCart, Store, TrendingDown } from 'lucide-react';
import { useProductSearch } from '../hooks';
import { useCart } from '../context/CartContext';
import type { Product } from '../types';

const crowdConfig = {
  low:    { color: '#16a34a', bg: '#dcfce7', label: 'Low Traffic' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moderate Traffic' },
  high:   { color: '#dc2626', bg: '#fee2e2', label: 'Busy' },
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { results, loading, search } = useProductSearch();
  const { addItem } = useCart();

  useEffect(() => { if (query) search(query); }, [query]);

  // Group results by store
  const byStore: Record<string, { storeId: string; storeName: string; products: { product: Product; price: number; inStock: boolean }[] }> = {};
  results.forEach(product => {
    product.prices.forEach(p => {
      if (!byStore[p.storeId]) byStore[p.storeId] = { storeId: p.storeId, storeName: p.storeName, products: [] };
      byStore[p.storeId].products.push({ product, price: p.price, inStock: p.inStock });
    });
  });

  const lowestPriceMap: Record<string, number> = {};
  results.forEach(product => {
    const min = Math.min(...product.prices.map(p => p.price));
    lowestPriceMap[product._id] = min;
  });

  return (
    <div style={{backgroundColor:'#f8fafc', minHeight:'100vh'}}>
      <div className="flex" style={{paddingTop:'56px', height:'100vh'}}>
        {/* Left: Map */}
        <div className="flex-shrink-0 border-r border-gray-200 bg-gray-100 relative" style={{width:'480px'}}>
          <div className="h-full flex items-center justify-center">
            <div className="text-center bg-white rounded-xl p-5 shadow-sm mx-4" style={{maxWidth:'300px'}}>
              <MapPin className="w-10 h-10 mx-auto mb-2" style={{color:'#8B1538'}} />
              <h3 className="font-semibold text-sm mb-1" style={{color:'#8B1538'}}>Interactive Map</h3>
              <p className="text-xs text-gray-500 mb-1">Google Maps integration</p>
              <p className="text-xs text-gray-400">Batong Malake, Los Baños</p>
              <p className="text-xs text-gray-400 mt-2">Showing {Object.keys(byStore).length} stores with matching products</p>
            </div>
          </div>
          {/* Crowd legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Crowd Level:</p>
            <div className="flex items-center gap-3">
              {Object.entries(crowdConfig).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: val.color}} />
                  <span className="text-xs text-gray-600 capitalize">{key === 'medium' ? 'Moderate' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            {/* Back + Header */}
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Map
            </button>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Search: <span className="font-semibold text-gray-800">"{query}"</span></p>
                <p className="text-sm text-gray-400">{Object.keys(byStore).length} stores with matching products</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Results ({results.length} products)</span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_,i) => <div key={i} className="bg-white rounded-xl h-40 animate-pulse" />)}
              </div>
            ) : Object.keys(byStore).length === 0 ? (
              <div className="text-center py-16 text-gray-400">No products found for "{query}"</div>
            ) : (
              <div className="space-y-4">
                {Object.values(byStore).map(({ storeId, storeName, products }) => {
                  // Find store info from results
                  const storeInfo = results.flatMap(p => p.prices).find(p => p.storeId === storeId);
                  return (
                    <div key={storeId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      {/* Store header */}
                      <div className="px-5 py-4 border-b border-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" style={{color:'#8B1538'}} />
                            <div>
                              <p className="font-semibold text-gray-800">{storeName}</p>
                              <p className="text-xs text-gray-400">Batong Malake, Los Baños</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{color:'#d97706', backgroundColor:'#fef3c7'}}>
                              <Users className="w-3 h-3" /> Moderate Traffic
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">4.5</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Products */}
                      <div className="divide-y divide-gray-50">
                        {products.map(({ product, price, inStock }) => {
                          const isLowest = price === lowestPriceMap[product._id] && product.prices.length > 1;
                          const diff = price - lowestPriceMap[product._id];
                          return (
                            <div key={product._id} className="px-5 py-4 flex items-center gap-4">
                              <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 mb-0.5">{product.name}</p>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded">{product.category}</span>
                                  {isLowest && (
                                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{backgroundColor:'#16a34a'}}>
                                      <TrendingDown className="w-3 h-3" /> Lowest Price
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>{product.rating}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${inStock ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                                    {inStock ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xl font-bold mb-0.5" style={{color:'#8B1538'}}>₱{price.toFixed(2)}</p>
                                {!isLowest && diff > 0 && <p className="text-xs text-red-500 mb-2">+₱{diff.toFixed(2)}</p>}
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => navigate(`/store/${storeId}`)} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                                    <Store className="w-3 h-3" /> View Store
                                  </button>
                                  <button
                                    disabled={!inStock}
                                    onClick={() => addItem({ productId: product._id, productName: product.name, storeId, storeName, price, image: product.image })}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-white rounded-lg disabled:opacity-40"
                                    style={{backgroundColor:'#8B1538'}}
                                  >
                                    <ShoppingCart className="w-3 h-3" /> Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
