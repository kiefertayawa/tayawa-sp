import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, OverlayView } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import type { Store } from '../../types';

// Default centre: Los Baños, Laguna
const DEFAULT_CENTER = { lat: 14.1664, lng: 121.2417 };

const MAP_OPTIONS: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    ],
};

const crowdColor: Record<string, string> = {
    low: '#16a34a',
    medium: '#d97706',
    high: '#dc2626',
};

interface HomeMapProps {
    stores: Store[];
    height?: string | number;
}

export default function HomeMap({ stores, height = '400px' }: HomeMapProps) {
    const navigate = useNavigate();
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [activePin, setActivePin] = useState<string | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    // Get user's real location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setCenter(DEFAULT_CENTER),
                { timeout: 5000 },
            );
        }
    }, []);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const containerStyle = {
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '16px',
    };

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={16}
            options={MAP_OPTIONS}
            onLoad={onLoad}
        >
            {stores.map((store) => {
                const pinColor = crowdColor[store.crowdLevel] ?? '#8B1538';
                const isActive = activePin === store._id;
                return (
                    <OverlayView
                        key={store._id}
                        position={{ lat: store.location.lat, lng: store.location.lng }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div
                            onClick={() => navigate(`/store/${store._id}`)}
                            onMouseEnter={() => setActivePin(store._id)}
                            onMouseLeave={() => setActivePin(null)}
                            title={store.name}
                            style={{
                                position: 'absolute',
                                transform: 'translate(-50%, -100%)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                userSelect: 'none',
                            }}
                        >
                            {/* Tooltip on hover */}
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '6px',
                                    backgroundColor: '#111827',
                                    color: '#fff',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    zIndex: 10,
                                }}>
                                    {store.name}
                                </div>
                            )}
                            {/* Pin SVG */}
                            <svg
                                width={isActive ? 36 : 30}
                                height={isActive ? 44 : 36}
                                viewBox="0 0 30 38"
                                style={{
                                    filter: isActive
                                        ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))'
                                        : 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 23 15 23S30 25.5 30 15C30 6.716 23.284 0 15 0z" fill={pinColor} />
                                <circle cx="15" cy="15" r="7" fill="white" fillOpacity="0.9" />
                            </svg>
                        </div>
                    </OverlayView>
                );
            })}
        </GoogleMap>
    );
}
