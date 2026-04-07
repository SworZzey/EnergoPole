import React, { useEffect, useRef, useState } from 'react';
import { dbService } from '../services/dbService';
import type { Annotation } from '../db/database';

declare const fabric: any;

interface SchemaCanvasProps {
    schemaId: number;
    projectId: number;
    imageBlob: Blob;
}

const SchemaCanvas: React.FC<SchemaCanvasProps> = ({ schemaId, projectId, imageBlob }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    // --- Вспомогательные функции ---

    // Собираем все важные свойства объекта для сохранения в БД
    const getObjectData = (obj: any) => {
        const baseData = {
            left: obj.left,
            top: obj.top,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            angle: obj.angle,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            fill: obj.fill,
            type: obj.type, // внутренний тип fabric (rect, line, textbox)
        };

        if (obj.type === 'line') {
            return { ...baseData, x1: obj.x1, y1: obj.y1, x2: obj.x2, y2: obj.y2 };
        } else if (obj.type === 'rect') {
            return { ...baseData, width: obj.width, height: obj.height };
        } else if (obj.type === 'textbox') {
            return { ...baseData, text: obj.text, fontSize: obj.fontSize };
        } else if (obj.type === 'image') {
            // Сохраняем dataURL изображения (временно, потом заменим на photoId)
            return { ...baseData, dataURL: obj.getSrc(), width: obj.width, height: obj.height };
        }
        return baseData;
    };

    // Обновление аннотации в БД
    const updateAnnotation = async (obj: any) => {
        const id = obj.get('id');
        if (!id) return;

        const data = getObjectData(obj);
        await dbService.updateAnnotation(id, {
            coordinates: JSON.stringify(data),
            content: obj.type === 'textbox' ? obj.text : undefined
        });
    };

    // Сохранение новой аннотации
    const saveAnnotation = async (obj: any, annotationType: Annotation['type']) => {
        const data = getObjectData(obj);
        const annotation: Omit<Annotation, 'id'> = {
            schemaId,
            projectId,
            type: annotationType,
            coordinates: JSON.stringify(data),
            content: obj.type === 'textbox' ? obj.text : undefined,
            createdAt: new Date(),
        };
        const id = await dbService.addAnnotation(annotation);
        obj.set('id', id);
    };

    // --- Эффекты ---

    // 1. Инициализация холста
    useEffect(() => {
        mountedRef.current = true;
        const canvasElement = canvasRef.current;
        if (!canvasElement || typeof fabric === 'undefined') {
            setError(!canvasElement ? 'Canvas не найден' : 'Fabric.js не загружен');
            setLoading(false);
            return;
        }

        const canvas = new fabric.Canvas(canvasElement, {
            selection: true,
            preserveObjectStacking: true,
            width: window.innerWidth - 40,
            height: window.innerHeight - 200,
        });
        fabricCanvasRef.current = canvas;

        const url = URL.createObjectURL(imageBlob);
        fabric.Image.fromURL(url, (img: any) => {
            if (!mountedRef.current || !img) {
                if (!img) setError('Ошибка загрузки изображения');
                URL.revokeObjectURL(url);
                setLoading(false);
                return;
            }

            const scale = Math.min(canvas.getWidth() / img.width, canvas.getHeight() / img.height);
            img.scale(scale);
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
            canvas.setDimensions({ width: img.width * scale, height: img.height * scale });

            setLoading(false);
            URL.revokeObjectURL(url);
        });

        // Подписка на изменения
        canvas.on('object:modified', (e: any) => updateAnnotation(e.target));

        return () => {
            mountedRef.current = false;
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, [imageBlob]);

    // 2. Загрузка аннотаций
    useEffect(() => {
        if (loading || !fabricCanvasRef.current) return;

        const loadAnnotations = async () => {
            const annotations = await dbService.getAnnotationsBySchema(schemaId);
            const canvas = fabricCanvasRef.current;
            if (!canvas || !mountedRef.current) return;

            for (const ann of annotations) {   // ← заменили forEach на for...of
                const coords = JSON.parse(ann.coordinates);
                let obj: any = null;

                const options = {
                    left: coords.left,
                    top: coords.top,
                    scaleX: coords.scaleX,
                    scaleY: coords.scaleY,
                    angle: coords.angle,
                    stroke: coords.stroke,
                    strokeWidth: coords.strokeWidth,
                    fill: coords.fill,
                    id: ann.id,
                };

                switch (ann.type) {
                    case 'rect':
                        obj = new fabric.Rect({ ...options, width: coords.width, height: coords.height });
                        break;
                    case 'arrow':
                        obj = new fabric.Line([coords.x1, coords.y1, coords.x2, coords.y2], options);
                        break;
                    case 'text':
                        obj = new fabric.Textbox(coords.text, { ...options, fontSize: coords.fontSize });
                        break;
                    case 'image':
                        if (coords.dataURL) {
                            const imgEl = document.createElement('img');
                            imgEl.src = coords.dataURL;
                            imgEl.onload = () => {
                                const fabricImg = new fabric.Image(imgEl, {
                                    left: coords.left,
                                    top: coords.top,
                                    scaleX: coords.scaleX,
                                    scaleY: coords.scaleY,
                                    angle: coords.angle,
                                    id: ann.id,
                                });
                                canvas.add(fabricImg);
                                canvas.renderAll();
                            };
                        }
                        continue; // теперь continue работает, так как мы в for...of
                    default:
                        continue;
                }
                if (obj) canvas.add(obj);
            }
            canvas.renderAll();
        };
        loadAnnotations();
    }, [loading, schemaId]);

    // --- Управление фигурами ---

    const addShape = (type: 'rect' | 'arrow' | 'text') => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        let obj: any = null;
        const defaultProps = { left: 100, top: 100, stroke: 'red', strokeWidth: 2 };

        switch (type) {
            case 'rect':
                obj = new fabric.Rect({ ...defaultProps, width: 80, height: 50, fill: 'transparent' });
                break;
            case 'arrow':
                // Создаем линию. Fabric сам вычислит начальный left/top на основе точек
                obj = new fabric.Line([0, 0, 100, 100], { ...defaultProps, left: 150, top: 150 });
                break;
            case 'text':
                obj = new fabric.Textbox('Комментарий', { ...defaultProps, fontSize: 16, fill: 'black', stroke: 'transparent' });
                break;
        }

        if (obj) {
            canvas.add(obj);
            saveAnnotation(obj, type);
            canvas.setActiveObject(obj);
            canvas.renderAll();
        }
    };

    const addPhotoFromPC = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                const dataURL = event.target?.result as string;
                const canvas = fabricCanvasRef.current;
                if (!canvas) return;
                fabric.Image.fromURL(dataURL, (img: any) => {
                    img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
                    canvas.add(img);
                    saveAnnotation(img, 'image');
                    canvas.setActiveObject(img);
                    canvas.renderAll();
                });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const deleteSelected = async () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObjects();
        for (const obj of active) {
            const id = obj.get('id');
            if (id) await dbService.deleteAnnotation(id);
            canvas.remove(obj);
        }
        canvas.discardActiveObject().renderAll();
    };

    // Удаление по кнопке Delete
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => { if (e.key === 'Delete') deleteSelected(); };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    if (error) return <div style={{ color: 'red', padding: 20 }}>Ошибка: {error}</div>;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
                position: 'absolute', top: 10, left: 10, zIndex: 10,
                background: 'white', padding: 8, borderRadius: 8,
                display: 'flex', gap: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <button onClick={() => addShape('rect')}>⬛ Прямоугольник</button>
                <button onClick={() => addShape('arrow')}>➡️ Стрелка</button>
                <button onClick={() => addShape('text')}>📝 Текст</button>
                <button onClick={addPhotoFromPC}>🖼️ Фото</button>
                <button onClick={deleteSelected} style={{backgroundColor: '#fff0f0'}}>🗑️ Удалить</button>
            </div>

            <canvas ref={canvasRef} style={{border: '1px solid #ccc' }} />

            {loading && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    background: 'rgba(0,0,0,0.8)', color: 'white', padding: '15px 25px', borderRadius: 8
                }}>
                    Загрузка схемы...
                </div>
            )}
        </div>
    );
};

export default SchemaCanvas;