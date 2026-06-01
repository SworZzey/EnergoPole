//Геоданные которые добавляются к фотке в режиме инженера
import React from 'react';
import styles from './PhotoGeoModal.module.css';

interface PhotoGeoModalProps {
    photoInfo: {
        id: string;
        latitude: number | null;
        longitude: number | null;
        accuracy?: number | null;
        capturedAt?: Date | null;
    };
    onClose: () => void;
}

const PhotoGeoModal: React.FC<PhotoGeoModalProps> = ({ photoInfo, onClose }) => {
    const hasCoords = photoInfo.latitude !== null && photoInfo.longitude !== null;

    // Рассчитываем URL только если координаты есть
    const mapUrl = hasCoords
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${photoInfo.longitude! - 0.001},${photoInfo.latitude! - 0.001},${photoInfo.longitude! + 0.001},${photoInfo.latitude! + 0.001}&layer=mapnik&marker=${photoInfo.latitude},${photoInfo.longitude}`
        : '';

    const formatCoords = (val: number, type: 'lat' | 'lon') => {
        const abs = Math.abs(val);
        const dir = type === 'lat' ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
        return `${abs.toFixed(6)}° ${dir}`;
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h3 className={styles.title}>Геолокация фото</h3>

                {hasCoords ? (
                    <>
                        {/* Карта */}
                        <div className={styles.mapContainer}>
                            <iframe
                                src={mapUrl}
                                width="100%"
                                height="250"
                                style={{ border: 0, borderRadius: '12px' }}
                                loading="lazy"
                                title="Карта местоположения"
                            />
                        </div>

                        {/* Данные */}
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Широта:</span>
                                <span className={styles.value}>{formatCoords(photoInfo.latitude!, 'lat')}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Долгота:</span>
                                <span className={styles.value}>{formatCoords(photoInfo.longitude!, 'lon')}</span>
                            </div>
                            {photoInfo.accuracy && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>Точность:</span>
                                    <span className={styles.value}>±{Math.round(photoInfo.accuracy)} м</span>
                                </div>
                            )}
                            {photoInfo.capturedAt && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>Захвачено:</span>
                                    <span className={styles.value}>
                                        {new Date(photoInfo.capturedAt).toLocaleString('ru-RU')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Кнопки */}
                        <div className={styles.actions}>
                            <a
                                href={`https://www.openstreetmap.org/?mlat=${photoInfo.latitude}&mlon=${photoInfo.longitude}#map=18/${photoInfo.latitude}/${photoInfo.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.openMapButton}
                            >
                                Открыть в полной карте
                            </a>
                            <button onClick={onClose} className={styles.closeButtonPrimary}>
                                Закрыть
                            </button>
                        </div>
                    </>
                ) : (
                    /* геоданные отсутствуют */
                    <div className={styles.warningContainer}>
                        <div className={styles.warningIcon}>📡</div>
                        <h4>Геоданные не получены</h4>
                        <p>
                            При добавлении этого фото не удалось определить ваше местоположение.
                        </p>
                        <p>
                            Это может быть связано с отсутствием GPS-модуля, блокировкой доступа
                            в настройках браузера или работой в офлайн-режиме.
                        </p>
                        <button onClick={onClose} className={styles.closeButtonPrimary}>
                            Понятно, закрыть
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoGeoModal;