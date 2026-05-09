// components/CanvasToolbar.tsx
import React from 'react';
import styles from './CanvasToolbar.module.css';

interface CanvasToolbarProps {
    onAddRect: () => void;
    onAddArrow: () => void;
    onAddText: () => void;
    onAddPhoto: () => void;
    onDelete: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
    onAddRect, onAddArrow, onAddText, onAddPhoto, onDelete
}) => {
    return (
        <div className={styles.toolbar}>
            <button onClick={onAddRect}>⬛ Прямоугольник</button>
            <button onClick={onAddArrow}>➡️ Стрелка</button>
            <button onClick={onAddText}>📝 Текст</button>
            <button onClick={onAddPhoto}>🖼️ Фото</button>
            <button className={styles.deleteButton} onClick={onDelete}>🗑️ Удалить</button>
        </div>
    );
};