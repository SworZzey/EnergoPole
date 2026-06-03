// src/components/InteractiveMap/InteractiveMap.tsx
import React from 'react';
import { Map, Marker } from 'pigeon-maps';
import styles from './InteractiveMap.module.css';

interface InteractiveMapProps {
    latitude: number | null;
    longitude: number | null;
    mode: 'edit' | 'view';
    onLocationChange?: (lat: number, lon: number) => void;
    height?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
                                                           latitude,
                                                           longitude,
                                                           mode,
                                                           onLocationChange,
                                                           height = '300px'
                                                       }) => {
    // Координаты по умолчанию (Москва), если нет выбранных
    const defaultLat = latitude ?? 55.7558;
    const defaultLon = longitude ?? 37.6173;
    const zoom = mode === 'edit' ? 13 : 16;

    const handleClick = ({ latLng }: { latLng: [number, number] }) => {
        if (mode === 'edit' && onLocationChange) {
            const [lat, lon] = latLng;
            onLocationChange(lat, lon);
        }
    };

    return (
        <div className={styles.mapContainer} style={{ height }}>
            <Map
                center={[defaultLat, defaultLon]}
                zoom={zoom}
                height={parseFloat(height)}
                onClick={handleClick}
                className={styles.pigeonMap}
                // Отключаем зум колесиком, чтобы не конфликтовал со скроллом страницы
                wheelZoom={false}
            >
                {/* Маркер, если координаты есть */}
                {(latitude !== null && longitude !== null) && (
                    <Marker anchor={[latitude, longitude]}>
                        <div style={{
                            fontSize: '28px',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}>
                            📍
                        </div>
                    </Marker>
                )}
            </Map>

            {mode === 'edit' && (
                <p className={styles.hint}>Кликните по карте, чтобы установить метку</p>
            )}
        </div>
    );
};

export default InteractiveMap;