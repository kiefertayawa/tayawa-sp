import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { Store } from '../../types';

// Fix Leaflet default icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [14.1664, 121.2417];

const crowdColor: Record<string, string> = {
    low: '#16a34a',
    medium: '#d97706',
    high: '#dc2626',
};

// ─── help determine status dynamically ──────────────────────
function parseMin(s: string) {
    const str = s.trim().toUpperCase().replace(/\s+/g, '');
    const m12 = str.match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)$/);
    if (m12) {
        let h = parseInt(m12[1], 10);
        const min = m12[2] ? parseInt(m12[2], 10) : 0;
        const ampm = m12[3];
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return h * 60 + min;
    }
    const m24 = str.match(/^(\d{1,2})(?::(\d{2}))?$/);
    if (m24) {
        const h = parseInt(m24[1], 10);
        const min = m24[2] ? parseInt(m24[2], 10) : 0;
        if (h >= 0 && h < 24) return h * 60 + min;
    }
    return -1;
}

function getLiveCrowdStatus(store: Store): 'low' | 'medium' | 'high' {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();

    // 1. Reality Check (The Live Pulse)
    if (store.lastCrowdLevel && store.lastCrowdLevel !== 'not_sure' && store.lastCrowdTime) {
        const reportTime = new Date(store.lastCrowdTime);
        const diffInMinutes = (now.getTime() - reportTime.getTime()) / (1000 * 60);
        if (diffInMinutes >= 0 && diffInMinutes < 60) {
            return store.lastCrowdLevel as 'low' | 'medium' | 'high';
        }
    }

    // 2. Expectation Check (The Historical Pattern)
    const isCurrent = (slot: string) => {
        const parts = slot.split(/\s*[–\-\/tToO]+\s*/);
        if (parts.length < 2) return false;
        let sStr = parts[0].trim(), eStr = parts[1].trim();
        if (/[AP]M$/i.test(eStr) && !/[AP]M$/i.test(sStr)) {
            const suffix = eStr.slice(-2).toUpperCase();
            const endH = parseInt(eStr.split(':')[0], 10);
            const startH = parseInt(sStr.split(':')[0], 10);
            const sSuffix = (startH === 11 && endH === 12) ? (suffix === 'PM' ? 'AM' : 'PM') : suffix;
            sStr += sSuffix;
        }
        const sVal = parseMin(sStr), eVal = parseMin(eStr);
        if (sVal < 0 || eVal < 0) return false;
        if (sVal < eVal) return cur >= sVal && cur < eVal;
        return cur >= sVal || cur < eVal;
    };
    if (store.peakHours && isCurrent(store.peakHours)) return 'high';
    if (store.offPeakHours && isCurrent(store.offPeakHours)) return 'low';
    return 'medium';
}

// ── Build a divIcon with the label embedded in HTML ─────────────────────────
function buildHomeIcon(color: string, name: string) {
    return L.divIcon({
        className: '',
        iconSize: [10, 58],
        iconAnchor: [5, 58],
        html: `
      <div class="pamili-home-pin" data-color="${color}">
        <div class="pamili-home-label">${name}</div>
        <svg width="26" height="32" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 23 15 23S30 25.5 30 15C30 6.716 23.284 0 15 0z" fill="${color}"/>
          <circle cx="15" cy="15" r="7" fill="white" fill-opacity="0.9"/>
        </svg>
      </div>
    `,
    });
}

// ── Manual GPS Locator ────────────────────────────────────────────────────────
function GeoLocator({ userPos, onLocate }: { userPos: [number, number] | null; onLocate: (pos: [number, number]) => void }) {
    const map = useMap();
    const btnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (btnRef.current) {
            L.DomEvent.disableClickPropagation(btnRef.current);
            L.DomEvent.disableScrollPropagation(btnRef.current);
        }
    }, []);

    // Background fetch on mount
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => onLocate([pos.coords.latitude, pos.coords.longitude]),
            () => { },
            { timeout: 5000 }
        );
    }, [onLocate]);

    return (
        <button
            ref={btnRef}
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (userPos) {
                    map.flyTo(userPos, 17, { animate: true, duration: 1.2 });
                }
                // Also trigger a fresh high-accuracy update
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                        onLocate(coords);
                        map.flyTo(coords, 17, { animate: true, duration: 1.2 });
                    },
                    (err) => toast.error("Could not find your location: " + err.message),
                    { enableHighAccuracy: true, timeout: 15000 }
                );
            }}
            style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 500,
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            title="Locate Me"
        >
            <MapPin style={{ width: 18, height: 18, color: '#8B1538' }} />
        </button>
    );
}

function FitBounds({ stores }: { stores: Store[] }) {
    const map = useMap();

    const handleFit = useCallback(() => {
        if (!stores.length) return;
        const bounds = L.latLngBounds(stores.map(s => [s.location.lat, s.location.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [stores, map]);

    // Initial Fit
    useEffect(() => {
        handleFit();
    }, [handleFit]);

    // Visibility Reset
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                handleFit();
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [handleFit]);

    return null;
}

interface HomeMapProps {
    stores: Store[];
    height?: string | number;
}

export default function HomeMap({ stores, height = '560px' }: HomeMapProps) {
    const navigate = useNavigate();
    const [userLoc, setUserLoc] = useState<[number, number] | null>(null);

    return (
        <MapContainer
            center={DEFAULT_CENTER}
            zoom={16}
            style={{
                width: '100%',
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius: '16px',
                zIndex: 0,
            }}
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                maxZoom={19}
            />

            <GeoLocator userPos={userLoc} onLocate={setUserLoc} />
            <FitBounds stores={stores} />

            {userLoc && (
                <CircleMarker
                    center={userLoc}
                    radius={8}
                    pathOptions={{
                        fillColor: '#3b82f6',
                        fillOpacity: 1,
                        color: '#fff',
                        weight: 2
                    }}
                />
            )}

            {stores.map((store) => {
                const status = getLiveCrowdStatus(store);
                const color = crowdColor[status] ?? '#8B1538';
                return (
                    <Marker
                        key={store._id}
                        position={[store.location.lat, store.location.lng]}
                        icon={buildHomeIcon(color, store.name)}
                        eventHandlers={{ click: () => navigate(`/store/${store._id}`) }}
                    />
                );
            })}
        </MapContainer>
    );
}
