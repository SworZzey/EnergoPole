// src/components/TaskGeoView/TaskGeoView.tsx
import React from 'react';
import InteractiveMap from '../InteractiveMap/InteractiveMap';
import styles from './TaskGeoView.module.css';

interface TaskGeoViewProps {
    latitude: number | null;
    longitude: number | null;
    taskTitle?: string;
}

const TaskGeoView: React.FC<TaskGeoViewProps> = ({ latitude, longitude, taskTitle }) => {
    const hasCoords = latitude !== null && longitude !== null;

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>
                {taskTitle ? `📍 ${taskTitle}` : '📍 Местоположение задачи'}
            </h4>

            {hasCoords ? (
                <>
                    <InteractiveMap
                        latitude={latitude}
                        longitude={longitude}
                        mode="view"
                        height="200px"
                    />
                    <div className={styles.coords}>
                        <span className={styles.label}>Координаты:</span>
                        <span className={styles.value}>
                            {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                        </span>
                    </div>
                    <a
                        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.openMapLink}
                    >
                        🗺️ Открыть в полной карте
                    </a>
                </>
            ) : (
                <div className={styles.noCoords}>
                    <span className={styles.icon}>📡</span>
                    <p>Координаты не указаны</p>
                </div>
            )}
        </div>
    );
};

export default TaskGeoView;