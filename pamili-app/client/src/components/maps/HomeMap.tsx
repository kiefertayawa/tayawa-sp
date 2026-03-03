import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
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

// ── Build a divIcon with the label embedded in HTML ─────────────────────────
// iconSize is fixed so Leaflet never repositions other markers on hover.
// CSS :hover on .pamili-home-pin scales from bottom-center (pin tip stays put).
function buildHomeIcon(color: string, name: string) {
    return L.divIcon({
        className: '',
        // Fixed container: wide enough for most names, tall enough for label+gap+pin
        iconSize: [10, 58],
        iconAnchor: [5, 58], // bottom-center of pin (not label)
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

// ── Pan to user's real GPS location ─────────────────────────────────────────
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

interface HomeMapProps {
    stores: Store[];
    height?: string | number;
}

export default function HomeMap({ stores, height = '560px' }: HomeMapProps) {
    const navigate = useNavigate();

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
            <GeoLocator />

            {stores.map((store) => (
                <Marker
                    key={store._id}
                    position={[store.location.lat, store.location.lng]}
                    icon={buildHomeIcon(crowdColor[store.crowdLevel] ?? '#8B1538', store.name)}
                    eventHandlers={{ click: () => navigate(`/store/${store._id}`) }}
                />
            ))}
        </MapContainer>
    );
}
