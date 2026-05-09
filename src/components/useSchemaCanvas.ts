// hooks/useSchemaCanvas.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import type { Annotation } from '../db/database';
import type { IFabricCanvas, IFabricObject, IFabricImage, FabricEvent } from './fabric'; // Импортируем типы


interface UseSchemaCanvasProps {
    schemaId: number;
    projectId: number;
    imageBlob: Blob;
}

export const useSchemaCanvas = ({ schemaId, projectId, imageBlob }: UseSchemaCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Используем наш тип вместо any
    const fabricCanvasRef = useRef<IFabricCanvas | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    // --- Вспомогательные функции ---

    // Типизируем аргумент как IFabricObject
    const getObjectData = (obj: IFabricObject) => {
        const baseData = {
            left: obj.left,
            top: obj.top,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            angle: obj.angle,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            fill: obj.fill,
            type: obj.type,
        };

        if (obj.type === 'line') {
            return {
                ...baseData,
                x1: (obj as any).x1,
                y1: (obj as any).y1,
                x2: (obj as any).x2,
                y2: (obj as any).y2
            };
        } else if (obj.type === 'rect') {
            return { ...baseData, width: obj.width, height: obj.height };
        } else if (obj.type === 'textbox') {
            return { ...baseData, text: (obj as any).text, fontSize: (obj as any).fontSize };
        } else if (obj.type === 'image') {
            // getSrc есть в нашем интерфейсе IFabricObject опционально
            return { ...baseData, dataURL: obj.getSrc ? obj.getSrc() : '', width: obj.width, height: obj.height };
        }
        return baseData;
    };

    const updateAnnotation = async (obj: IFabricObject) => {
        const id = obj.get('id');
        if (!id) return;

        const data = getObjectData(obj);
        try {
            await dbService.updateAnnotation(id, {
                coordinates: JSON.stringify(data),
                content: obj.type === 'textbox' ? (obj as any).text : undefined
            });
        } catch (e) {
            console.error("Failed to update annotation", e);
        }
    };

    const saveAnnotation = async (obj: IFabricObject, annotationType: Annotation['type']) => {
        const data = getObjectData(obj);
        const annotation: Omit<Annotation, 'id'> = {
            schemaId,
            projectId,
            type: annotationType,
            coordinates: JSON.stringify(data),
            content: obj.type === 'textbox' ? (obj as any).text : undefined,
            createdAt: new Date(),
        };
        try {
            const id = await dbService.addAnnotation(annotation);
            obj.set('id', id);
        } catch (e) {
            console.error("Failed to save annotation", e);
        }
    };

    // --- Эффекты ---

    // 1. Инициализация холста
    useEffect(() => {
        mountedRef.current = true;
        const canvasElement = canvasRef.current;

        // Проверка наличия window.fabric
        if (!canvasElement || typeof window.fabric === 'undefined') {
            setError(!canvasElement ? 'Canvas не найден' : 'Fabric.js не загружен');
            setLoading(false);
            return;
        }

        // Теперь TypeScript знает, что window.fabric.Canvas существует
        const canvas = new window.fabric.Canvas(canvasElement, {
            selection: true,
            preserveObjectStacking: true,
            width: window.innerWidth - 40,
            height: window.innerHeight - 200,
        });

        fabricCanvasRef.current = canvas;

        const url = URL.createObjectURL(imageBlob);

        // Используем типизированный вызов
        window.fabric.Image.fromURL(url, (img: IFabricImage) => {
            if (!mountedRef.current || !img) {
                if (!img) setError('Ошибка загрузки изображения');
                URL.revokeObjectURL(url);
                setLoading(false);
                return;
            }

            const scale = Math.min(canvas.getWidth() / img.width, canvas.getHeight() / img.height);
            img.scale(scale);

            // setBackgroundImage требует IFabricImage
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
            canvas.setDimensions({ width: img.width * scale, height: img.height * scale });

            setLoading(false);
            URL.revokeObjectURL(url);
        });

        // Типизируем событие
        canvas.on('object:modified', (e: FabricEvent) => updateAnnotation(e.target));

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

            for (const ann of annotations) {
                const coords = JSON.parse(ann.coordinates);
                let obj: IFabricObject | null = null;

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
                        // window.fabric.Rect возвращает IFabricObject
                        obj = new window.fabric.Rect({ ...options, width: coords.width, height: coords.height });
                        break;
                    case 'arrow':
                        // window.fabric.Line возвращает IFabricObject
                        obj = new window.fabric.Line([coords.x1, coords.y1, coords.x2, coords.y2], options);
                        break;
                    case 'text':
                        // window.fabric.Textbox возвращает IFabricObject
                        obj = new window.fabric.Textbox(coords.text, { ...options, fontSize: coords.fontSize });
                        break;
                    case 'image':
                        if (coords.dataURL) {
                            const imgEl = document.createElement('img');
                            imgEl.src = coords.dataURL;
                            imgEl.onload = () => {
                                // new window.fabric.Image возвращает IFabricImage (который наследуется от IFabricObject)
                                const fabricImg = new window.fabric.Image(imgEl, {
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
                        continue;
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

    const addShape = useCallback((type: 'rect' | 'arrow' | 'text') => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        let obj: IFabricObject | null = null;
        const defaultProps = { left: 100, top: 100, stroke: 'red', strokeWidth: 2 };

        switch (type) {
            case 'rect':
                obj = new window.fabric.Rect({ ...defaultProps, width: 80, height: 50, fill: 'transparent' });
                break;
            case 'arrow':
                obj = new window.fabric.Line([0, 0, 100, 100], { ...defaultProps, left: 150, top: 150 });
                break;
            case 'text':
                obj = new window.fabric.Textbox('Комментарий', { ...defaultProps, fontSize: 16, fill: 'black', stroke: 'transparent' });
                break;
        }

        if (obj) {
            canvas.add(obj);
            saveAnnotation(obj, type);
            canvas.setActiveObject(obj);
            canvas.renderAll();
        }
    }, []);

    const addPhotoFromPC = useCallback(() => {
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

                window.fabric.Image.fromURL(dataURL, (img: IFabricImage) => {
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
    }, []);

    const deleteSelected = useCallback(async () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObjects();
        for (const obj of active) {
            const id = obj.get('id');
            if (id) await dbService.deleteAnnotation(id);
            canvas.remove(obj);
        }
        canvas.discardActiveObject().renderAll();
    }, []);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => { if (e.key === 'Delete') deleteSelected(); };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [deleteSelected]);

    return {
        canvasRef,
        loading,
        error,
        actions: { addShape, addPhotoFromPC, deleteSelected }
    };
};