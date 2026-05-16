// src/components/InteractiveMap/InteractiveMap.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './InteractiveMap.module.css';

// Фикс для иконки маркера в Leaflet + Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapEventsProps {
    mode: 'edit' | 'view';
    onLocationSelect?: (lat: number, lon: number) => void;
}

// Компонент для обработки событий карты
const MapEvents: React.FC<MapEventsProps> = ({ mode, onLocationSelect }) => {
    useMapEvents({
        click: (e) => {
            if (mode === 'edit' && onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
};

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

    return (
        <div className={styles.mapContainer} style={{ height }}>
            <MapContainer
                center={[defaultLat, defaultLon]}
                zoom={zoom}
                scrollWheelZoom={true}
                className={styles.leafletMap}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Обработчик кликов для режима редактирования */}
                <MapEvents mode={mode} onLocationSelect={onLocationChange} />

                {/* Маркер, если координаты есть */}
                {(latitude !== null && longitude !== null) && (
                    <Marker position={[latitude, longitude]} />
                )}
            </MapContainer>

            {mode === 'edit' && (
                <p className={styles.hint}>👆 Кликните по карте, чтобы установить метку</p>
            )}
        </div>
    );
};

export default InteractiveMap;