// Создание канваса
import React, { useState, useEffect } from 'react';
import { useSchemaCanvas } from '../useSchemaCanvas.ts';
import { CanvasToolbar } from '../CanvasToolbar/CanvasToolbar.tsx';
import PhotoGeoModal from '../PhotoGeoModal/PhotoGeoModal';
import styles from './SchemaCanvas.module.css';

interface SchemaCanvasProps {
    schemaId: string;
    projectId: string;
    imageBlob: Blob;
    onBack: () => void;
}

const SchemaCanvas: React.FC<SchemaCanvasProps> = ({
                                                       schemaId,
                                                       projectId,
                                                       imageBlob,
                                                       onBack
                                                   }) => {
    const [selectedPhoto, setSelectedPhoto] = useState<{
        id: string;
        latitude: number | null;
        longitude: number | null;
        accuracy?: number | null;
        capturedAt?: Date | null;
    } | null>(null);

    const {
        canvasRef,
        loading,
        error,
        actions,
        resizeCanvas
    } = useSchemaCanvas({
        schemaId,
        projectId,
        imageBlob,
        onPhotoClick: setSelectedPhoto
    });

    useEffect(() => {
        if (!resizeCanvas) return;


        let resizeTimer: number;
        const handleResize = () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(resizeCanvas, 150);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.clearTimeout(resizeTimer);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [resizeCanvas]);

    if (error) return <div style={{ color: 'red', padding: 20 }}>Ошибка: {error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <button onClick={onBack} className={styles.backButton}>← Назад</button>
                <CanvasToolbar
                    onAddRect={() => actions.addShape('rect')}
                    onAddArrow={() => actions.addShape('arrow')}
                    onAddText={() => actions.addShape('text')}
                    onAddPhoto={actions.addPhotoFromPC}
                    onDelete={actions.deleteSelected}
                />
            </div>

            <div className={styles.canvasWrapper}>
                <canvas ref={canvasRef} className={styles.canvas} />
                {loading && (
                    <div className={styles.loadingOverlay}>
                        Загрузка схемы...
                    </div>
                )}
            </div>

            {selectedPhoto && (
                <PhotoGeoModal
                    photoInfo={selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                />
            )}
        </div>
    );
};

export default SchemaCanvas;