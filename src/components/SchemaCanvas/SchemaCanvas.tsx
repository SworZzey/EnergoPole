// SchemaCanvas.tsx
import React, {useState} from 'react';
import { useSchemaCanvas } from '../useSchemaCanvas.ts';
import { CanvasToolbar } from '../CanvasToolbar/CanvasToolbar.tsx';
import PhotoGeoModal from '../PhotoGeoModal/PhotoGeoModal';
import styles from './SchemaCanvas.module.css'

interface SchemaCanvasProps {
    schemaId: number;
    projectId: number;
    imageBlob: Blob;
}

const SchemaCanvas: React.FC<SchemaCanvasProps> = ({ schemaId, projectId, imageBlob }) => {
    const [selectedPhoto, setSelectedPhoto] = useState<{
        id: number;
        latitude: number | null;
        longitude: number | null;
        accuracy?: number | null;
        capturedAt?: Date | null;
    } | null>(null);

    const { canvasRef, loading, error, actions } = useSchemaCanvas({
        schemaId,
        projectId,
        imageBlob,
        onPhotoClick: setSelectedPhoto
    });

    if (error) return <div style={{ color: 'red', padding: 20 }}>Ошибка: {error}</div>;

    return (
        <div className={styles.container}>
            <CanvasToolbar
                onAddRect={() => actions.addShape('rect')}
                onAddArrow={() => actions.addShape('arrow')}
                onAddText={() => actions.addShape('text')}
                onAddPhoto={actions.addPhotoFromPC}
                onDelete={actions.deleteSelected}
            />

            <div style={{ position: 'relative' }}>
                <canvas ref={canvasRef} className={styles.canvas} style={{ border: '1px solid #ccc' }} />
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