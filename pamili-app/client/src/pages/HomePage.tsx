import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Users, Clock } from 'lucide-react';
import { useStores } from '../hooks';
import type { Store } from '../types';

const crowdConfig = {
  low:    { color: '#16a34a', bg: '#dcfce7', label: 'Low Traffic' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moderate Traffic' },
  high:   { color: '#dc2626', bg: '#fee2e2', label: 'Busy' },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { stores, loading } = useStores();

  return (
    <div style={{backgroundColor:'#f8fafc', minHeight:'100vh'}}>
      <div className="mx-auto px-6 py-8" style={{maxWidth:'1400px'}}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{color:'#8B1538'}}>Stores in Batong Malake</h1>
          <p className="text-gray-500 text-sm">Compare prices and find the best deals near you</p>
        </div>

        {/* Map Placeholder */}
        <div className="mb-8 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-100" style={{height:'400px'}}>
          <div className="h-full flex items-center justify-center">
            <div className="text-center bg-white rounded-xl p-6 shadow-sm" style={{maxWidth:'340px'}}>
              <MapPin className="w-12 h-12 mx-auto mb-3" style={{color:'#8B1538'}} />
              <h3 className="font-semibold mb-1" style={{color:'#8B1538'}}>Interactive Map</h3>
              <p className="text-sm text-gray-500 mb-1">Google Maps integration would display here</p>
              <p className="text-xs text-gray-400">Batong Malake, Los Baños, Laguna</p>
              <p className="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-100">Map pins and markers will appear when integrated</p>
            </div>
          </div>
        </div>

        {/* Store Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_,i) => <div key={i} className="bg-white rounded-xl h-80 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => <StoreCard key={store._id} store={store} onClick={() => navigate(`/store/${store._id}`)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function StoreCard({ store, onClick }: { store: Store; onClick: () => void }) {
  const crowd = crowdConfig[store.crowdLevel] ?? crowdConfig.low;
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="relative h-48 overflow-hidden">
        <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-base">{store.name}</h3>
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-2" style={{color: crowd.color, backgroundColor: crowd.bg}}>
            <Users className="w-3 h-3" /> {crowd.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" /> {store.address}
        </p>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium text-gray-800">{store.rating}</span>
          <span className="text-sm text-gray-400">({store.reviewCount})</span>
        </div>
        {store.peakHours.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Peak Hours:</p>
            <div className="flex flex-wrap gap-1.5">
              {store.peakHours.map((h) => (
                <span key={h} className="text-xs border border-gray-200 text-gray-600 px-2 py-0.5 rounded">{h}</span>
              ))}
            </div>
          </div>
        )}
        <button
          className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{backgroundColor:'#8B1538'}}
          onClick={onClick}
        >
          View Store
        </button>
      </div>
    </div>
  );
}
