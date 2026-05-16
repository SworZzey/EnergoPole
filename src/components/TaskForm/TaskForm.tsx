// src/components/TaskForm/TaskForm.tsx
import React, { useState } from 'react';
import { dbService } from '../../services/dbService';
import InteractiveMap from '../InteractiveMap/InteractiveMap';
import styles from './TaskForm.module.css';

interface TaskFormProps {
    projectId: number;
    onCancel: () => void;
    onSuccess: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ projectId, onCancel, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [mapExpanded, setMapExpanded] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        try {
            const blob = photo ? new Blob([photo], { type: photo.type }) : null;
            await dbService.addTask({
                projectId,
                title,
                description: desc,
                photoBlob: blob,
                latitude,
                longitude,
                status: 'open',
                createdBy: 'manager'
            });
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formOverlay} onClick={onCancel}>
            <form className={styles.formCard} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
                <h3>📝 Новая задача</h3>

                <input
                    placeholder="Название задачи"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={styles.input}
                    required
                />

                <textarea
                    placeholder="Описание"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    className={styles.textarea}
                />

                {/* Загрузка фото */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={e => setPhoto(e.target.files?.[0] || null)}
                    className={styles.fileInput}
                />

                {/* Карта: кнопка-переключатель + сама карта */}
                <div className={styles.mapSection}>
                    <button
                        type="button"
                        onClick={() => setMapExpanded(!mapExpanded)}
                        className={styles.mapToggleButton}
                    >
                        {mapExpanded ? '🗺️ Скрыть карту' : '📍 Указать место на карте'}
                    </button>

                    {mapExpanded && (
                        <InteractiveMap
                            latitude={latitude}
                            longitude={longitude}
                            mode="edit"
                            onLocationChange={(lat, lon) => {
                                setLatitude(lat);
                                setLongitude(lon);
                            }}
                            height="250px"
                        />
                    )}

                    {/* Отображение выбранных координат */}
                    {latitude !== null && longitude !== null && (
                        <div className={styles.coordsPreview}>
                            📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button type="button" onClick={onCancel} className="secondary-button">Отмена</button>
                    <button type="submit" disabled={loading} className="primary-button">
                        {loading ? 'Сохранение...' : 'Создать задачу'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaskForm;