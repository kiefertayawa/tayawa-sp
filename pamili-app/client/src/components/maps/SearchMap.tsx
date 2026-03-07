import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { Store as StoreType } from '../../types';

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

function getLiveCrowdStatus(store: StoreType): 'low' | 'medium' | 'high' {
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
    if (store.peakHours?.some(isCurrent)) return 'high';
    if (store.offPeakHours?.some(isCurrent)) return 'low';
    return 'medium';
}

// ── Build search pin icon ─────────────────────────────────────────────────────
function buildSearchIcon(color: string, price: number, highlighted: boolean) {
    const cls = highlighted ? 'pamili-search-pin highlighted' : 'pamili-search-pin';
    const labelBg = highlighted ? '#8B1538' : '#111827';
    return L.divIcon({
        className: '',
        iconSize: [10, 58],
        iconAnchor: [5, 58],
        html: `
      <div class="${cls}" data-color="${color}">
        <div class="pamili-search-label" style="background:${labelBg};">&#8369;${price.toFixed(2)}</div>
        <svg width="26" height="32" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
          ${highlighted ? `<circle cx="15" cy="15" r="14" fill="${color}" fill-opacity="0.2"/>` : ''}
          <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 23 15 23S30 25.5 30 15C30 6.716 23.284 0 15 0z" fill="${color}"/>
          <circle cx="15" cy="15" r="7" fill="white" fill-opacity="0.9"/>
        </svg>
      </div>
    `,
    });
}

// ── Pan to a lat/lng target ───────────────────────────────────────────────────
function MapController({ target }: { target: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) map.panTo(target, { animate: true, duration: 0.5 });
    }, [target, map]);
    return null;
}

// ── Manual GPS Locator ────────────────────────────────────────────────────────
function GeoLocator({ userPos, onLocate }: { userPos: [number, number] | null; onLocate: (pos: [number, number]) => void }) {
    const map = useMap();

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
            type="button"
            onClick={() => {
                if (userPos) {
                    map.flyTo(userPos, 17, { duration: 1.2 });
                }

                map.locate({ enableHighAccuracy: true });
                map.once('locationfound', (e) => {
                    const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
                    onLocate(coords);
                    map.flyTo(e.latlng, 17, { duration: 1.2 });
                });
                map.once('locationerror', (err) => {
                    toast.error("Could not find your location: " + err.message);
                });
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

function FitBounds({ pins }: { pins: { store: StoreType; price: number }[] }) {
    const map = useMap();

    const handleFit = useCallback(() => {
        if (!pins.length) return;
        const bounds = L.latLngBounds(pins.map(p => [p.store.location.lat, p.store.location.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [pins, map]);

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

interface SearchMapProps {
    pins: { store: StoreType; price: number }[];
    onStoreClick: (storeId: string) => void;
    highlightedStoreId?: string | null;
}

export default function SearchMap({ pins, onStoreClick, highlightedStoreId }: SearchMapProps) {
    const [userPos, setUserPos] = useState<[number, number] | null>(null);

    const panTarget = (() => {
        if (!highlightedStoreId) return null;
        const pin = pins.find(p => p.store._id === highlightedStoreId);
        return pin ? [pin.store.location.lat, pin.store.location.lng] as [number, number] : null;
    })();

    return (
        <MapContainer
            center={DEFAULT_CENTER}
            zoom={16}
            style={{ width: '100%', height: '100%', zIndex: 0 }}
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                maxZoom={19}
            />
            <GeoLocator userPos={userPos} onLocate={setUserPos} />
            <MapController target={panTarget} />
            <FitBounds pins={pins} />

            {userPos && (
                <Marker
                    position={userPos}
                    icon={L.divIcon({
                        className: '',
                        html: `<div style="
                            width:16px;
                            height:16px;
                            background:#2563eb;
                            border-radius:50%;
                            border:3px solid white;
                            box-shadow: 0 0 10px rgba(37,99,235,0.5);
                        "></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                    })}
                />
            )}

            {pins.map(({ store, price }) => {
                const status = getLiveCrowdStatus(store);
                const color = crowdColor[status] ?? '#8B1538';
                return (
                    <Marker
                        key={store._id}
                        position={[store.location.lat, store.location.lng]}
                        icon={buildSearchIcon(
                            color,
                            price,
                            highlightedStoreId === store._id,
                        )}
                        zIndexOffset={highlightedStoreId === store._id ? 1000 : 0}
                        eventHandlers={{ click: () => onStoreClick(store._id) }}
                    />
                );
            })}
        </MapContainer>
    );
}
