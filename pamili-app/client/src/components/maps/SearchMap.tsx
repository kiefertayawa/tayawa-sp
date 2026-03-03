import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// ── Build search pin icon ─────────────────────────────────────────────────────
// The label (price) is embedded directly in the HTML.
// Hover is pure CSS — no React state → no other markers shifting.
// Highlighted state uses a different CSS class injected via HTML class attribute.
function buildSearchIcon(color: string, price: number, highlighted: boolean) {
    const cls = highlighted ? 'pamili-search-pin highlighted' : 'pamili-search-pin';
    const labelBg = highlighted ? '#8B1538' : '#111827';
    return L.divIcon({
        className: '',
        iconSize: [10, 58],    // fixed — never changes on hover
        iconAnchor: [5, 58],   // bottom-center anchored at pin tip
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

function UserLocationMarker() {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const map = useMap();

    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [
                    pos.coords.latitude,
                    pos.coords.longitude,
                ];

                setPosition(coords);
            }
        );
    }, []);

    if (!position) return null;

    return (
        <Marker
            position={position}
            icon={L.divIcon({
                className: '',
                html: `<div style="
          width:16px;
          height:16px;
          background:#2563eb;
          border-radius:50%;
          border:3px solid white;
        "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            })}
        />
    );
}

// ── Pan to a lat/lng target ───────────────────────────────────────────────────
function MapController({ target }: { target: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) map.panTo(target, { animate: true, duration: 0.5 });
    }, [target, map]);
    return null;
}

// ── Fly to user's real GPS on first load ─────────────────────────────────────
function GeoLocator() {
    const map = useMap();
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { duration: 1.2 }),
            () => { },
            { timeout: 6000 },
        );
    }, [map]);
    return null;
}

interface SearchMapProps {
    pins: { store: StoreType; price: number }[];
    onStoreClick: (storeId: string) => void;
    highlightedStoreId?: string | null;
}

function FitBounds({ pins }: { pins: any[] }) {
    const map = useMap();

    useEffect(() => {
        if (!pins.length) return;

        const bounds = L.latLngBounds(
            pins.map(p => [p.store.location.lat, p.store.location.lng])
        );

        map.fitBounds(bounds, { padding: [50, 50] });
    }, [pins, map]);

    return null;
}

export default function SearchMap({ pins, onStoreClick, highlightedStoreId }: SearchMapProps) {
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
            <GeoLocator />
            <MapController target={panTarget} />
            <FitBounds pins={pins} />
            <UserLocationMarker />

            {pins.map(({ store, price }) => (
                <Marker
                    key={store._id}
                    position={[store.location.lat, store.location.lng]}
                    icon={buildSearchIcon(
                        crowdColor[store.crowdLevel] ?? '#8B1538',
                        price,
                        highlightedStoreId === store._id,
                    )}
                    zIndexOffset={highlightedStoreId === store._id ? 1000 : 0}
                    eventHandlers={{ click: () => onStoreClick(store._id) }}
                />
            ))}
        </MapContainer>
    );
}
