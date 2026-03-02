import { useEffect, useRef, useCallback, useState } from 'react';
import { GoogleMap, OverlayView } from '@react-google-maps/api';
import type { Store as StoreType } from '../../types';

const DEFAULT_CENTER = { lat: 14.1664, lng: 121.2417 };

const crowdColor: Record<string, string> = {
    low: '#16a34a',
    medium: '#d97706',
    high: '#dc2626',
};

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

interface SearchMapProps {
    pins: { store: StoreType; price: number }[];
    onStoreClick: (storeId: string) => void;
    highlightedStoreId?: string | null;
}

export default function SearchMap({ pins, onStoreClick, highlightedStoreId }: SearchMapProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const userLocRef = useRef<{ lat: number; lng: number } | null>(null);
    const [hoveredStoreId, setHoveredStoreId] = useState<string | null>(null);

    // Get user location once and set map centre
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    userLocRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    mapRef.current?.panTo(userLocRef.current);
                },
                () => { },
                { timeout: 5000 },
            );
        }
    }, []);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        if (userLocRef.current) map.panTo(userLocRef.current);
    }, []);

    // Pan to highlighted store when it changes
    useEffect(() => {
        if (!highlightedStoreId || !mapRef.current) return;
        const pin = pins.find(p => p.store._id === highlightedStoreId);
        if (pin?.store.location) {
            mapRef.current.panTo({ lat: pin.store.location.lat, lng: pin.store.location.lng });
        }
    }, [highlightedStoreId, pins]);

    return (
        <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={DEFAULT_CENTER}
            zoom={16}
            options={MAP_OPTIONS}
            onLoad={onLoad}
        >
            {pins.map(({ store, price }) => {
                const pinColor = crowdColor[store.crowdLevel] ?? '#8B1538';
                const isHighlighted = highlightedStoreId === store._id;
                const isHovered = hoveredStoreId === store._id;

                return (
                    <OverlayView
                        key={store._id}
                        position={{ lat: store.location.lat, lng: store.location.lng }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div
                            onClick={() => onStoreClick(store._id)}
                            onMouseEnter={() => setHoveredStoreId(store._id)}
                            onMouseLeave={() => setHoveredStoreId(null)}
                            title={store.name}
                            style={{
                                position: 'absolute',
                                transform: `translate(-50%, -100%) scale(${isHovered ? 1.15 : 1})`,
                                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                userSelect: 'none',
                                zIndex: isHighlighted || isHovered ? 20 : 10,
                            }}
                        >
                            {/* Price label */}
                            <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginBottom: '4px',
                                backgroundColor: isHighlighted ? '#8B1538' : '#111827',
                                color: '#fff',
                                fontSize: '0.86rem', // Made text bigger
                                fontWeight: 700,     // Bolder text
                                padding: '4px 10px',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                opacity: isHighlighted || isHovered ? 1 : 0.9,
                                boxShadow: isHighlighted ? '0 2px 8px rgba(139,21,56,0.4)' : '0 2px 5px rgba(0,0,0,0.2)',
                            }}>
                                ₱{price.toFixed(2)}
                            </div>

                            {/* Pin SVG — enlarged + glowing when highlighted */}
                            <svg
                                width={isHighlighted ? 40 : 30}
                                height={isHighlighted ? 50 : 38}
                                viewBox="0 0 30 38"
                                style={{
                                    filter: isHighlighted
                                        ? `drop-shadow(0 0 6px ${pinColor})`
                                        : 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {isHighlighted && (
                                    <circle cx="15" cy="15" r="14" fill={pinColor} fillOpacity="0.2" />
                                )}
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
