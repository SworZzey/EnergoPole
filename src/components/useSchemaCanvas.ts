// Логика канваса
import { useEffect, useRef, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import type { Annotation } from '../db/database';
import type { IFabricCanvas, IFabricObject, IFabricImage, FabricEvent } from './fabric';

interface UseSchemaCanvasProps {
    schemaId: number;
    projectId: number;
    imageBlob: Blob;
    onPhotoClick?: (photoInfo: {
        id: number;
        latitude: number | null;
        longitude: number | null;
        accuracy?: number | null;
        capturedAt?: Date | null;
    }) => void;
}

export const useSchemaCanvas = ({ schemaId, projectId, imageBlob, onPhotoClick }: UseSchemaCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<IFabricCanvas | null>(null);

    const canvasInstance = useRef<IFabricCanvas | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

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

    const saveAnnotation = async (
        obj: IFabricObject,
        annotationType: Annotation['type'],
        geoData?: { latitude: number | null; longitude: number | null; accuracy: number | null }
    ) => {
        const data = getObjectData(obj);
        const annotation: Omit<Annotation, 'id'> = {
            schemaId,
            projectId,
            type: annotationType,
            coordinates: JSON.stringify(data),
            content: obj.type === 'textbox' ? (obj as any).text : undefined,
            createdAt: new Date(),
            latitude: annotationType === 'image' ? geoData?.latitude ?? null : null,
            longitude: annotationType === 'image' ? geoData?.longitude ?? null : null,
            geoAccuracy: annotationType === 'image' ? geoData?.accuracy ?? null : null,
            geoCapturedAt: annotationType === 'image' && geoData?.latitude ? new Date() : null,
        };

        try {
            const id = await dbService.addAnnotation(annotation);
            obj.set('id', id);
            if (geoData?.latitude) {
                obj.set('geoData', geoData);
            }
        } catch (e) {
            console.error("Failed to save annotation", e);
        }
    };


    const resizeCanvas = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !mountedRef.current) return;

        // Получаем размеры доступной области
        const toolbarHeight = 60;
        const availableWidth = window.innerWidth;
        const availableHeight = window.innerHeight - toolbarHeight;

        // Получаем фоновое изображение
        const bgImage = canvas.backgroundImage as IFabricImage;

        // Если изображение ещё не загрузилось или не имеет размеров — выходим
        if (!bgImage || !bgImage.width || !bgImage.height) {
            return;
        }

        const imgWidth = bgImage.width;
        const imgHeight = bgImage.height;

        // Вычисляем масштаб
        const scale = Math.min(
            availableWidth / imgWidth,
            availableHeight / imgHeight,
            1
        );

        // Устанавливаем размеры
        canvas.setDimensions({
            width: imgWidth * scale,
            height: imgHeight * scale
        });

        // Обновляем масштаб самого изображения
        bgImage.scale(scale);

        // Центрируем и перерисовываем
        canvas.renderAll();
    }, []);

    // --- Эффекты ---

    // 1. Инициализация холста
    useEffect(() => {
        mountedRef.current = true;
        const canvasElement = canvasRef.current;

        if (!canvasElement || typeof window.fabric === 'undefined') {
            setError(!canvasElement ? 'Canvas не найден' : 'Fabric.js не загружен');
            setLoading(false);
            return;
        }

        const canvas = new window.fabric.Canvas(canvasElement, {
            selection: true,
            preserveObjectStacking: true,
            // Начальные размеры
            width: window.innerWidth - 40,
            height: window.innerHeight - 200,
        });

        fabricCanvasRef.current = canvas;
        canvasInstance.current = canvas;

        const url = URL.createObjectURL(imageBlob);

        window.fabric.Image.fromURL(url, (img: IFabricImage) => {
            if (!mountedRef.current || !img) {
                if (!img) setError('Ошибка загрузки изображения');
                URL.revokeObjectURL(url);
                setLoading(false);
                return;
            }

            // свойства центрирования
            img.set({
                originX: 'left',
                originY: 'top',
            });

            // устанавливаем изображение как фон
            canvas.setBackgroundImage(img, () => {
                canvas.renderAll();

                if (resizeCanvas) resizeCanvas();
            });

            setLoading(false);
            URL.revokeObjectURL(url);
        });

        // Обработчики кликов для геоданных
        let clickTarget: any = null;
        let isDragging = false;

        const triggerGeoModal = (target: any) => {
            const geoData = target.get('geoData') || {
                latitude: target.get('latitude'),
                longitude: target.get('longitude'),
                accuracy: target.get('geoAccuracy'),
                capturedAt: target.get('geoCapturedAt')
            };

            if (navigator.vibrate) navigator.vibrate(15);

            onPhotoClick?.({
                id: target.get('id'),
                latitude: geoData?.latitude ?? null,
                longitude: geoData?.longitude ?? null,
                accuracy: geoData?.accuracy ?? null,
                capturedAt: geoData?.capturedAt ?? null
            });
        };

        canvas.on('mouse:down', (opt) => {
            if (opt.target && opt.target.type === 'image') {
                clickTarget = opt.target;
                isDragging = false;
            }
        });

        canvas.on('object:moving', () => {
            isDragging = true;
        });

        canvas.on('mouse:up', () => {
            if (clickTarget && !isDragging) {
                triggerGeoModal(clickTarget);
            }
            clickTarget = null;
            isDragging = false;
        });

        canvas.on('object:modified', (e: FabricEvent) => updateAnnotation(e.target));

        // Слушаем изменение размера окна и ориентации
        const handleResize = () => {
            // Дебаунс 100мс, чтобы не дёргать канвас при каждом пикселе
            clearTimeout((handleResize as any)._timer);
            (handleResize as any)._timer = setTimeout(resizeCanvas, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            mountedRef.current = false;
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            clearTimeout((handleResize as any)._timer);
            canvas.dispose();
            fabricCanvasRef.current = null;
            canvasInstance.current = null;
        };
    }, [imageBlob, resizeCanvas, onPhotoClick]);

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
                        obj = new window.fabric.Rect({ ...options, width: coords.width, height: coords.height });
                        break;
                    case 'arrow':
                        obj = new window.fabric.Line([coords.x1, coords.y1, coords.x2, coords.y2], options);
                        break;
                    case 'text':
                        obj = new window.fabric.Textbox(coords.text, { ...options, fontSize: coords.fontSize });
                        break;
                    case 'image':
                        if (coords.dataURL) {
                            const imgEl = document.createElement('img');
                            imgEl.src = coords.dataURL;
                            imgEl.onload = () => {
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

                let latitude: number | null = null;
                let longitude: number | null = null;
                let accuracy: number | null = null;

                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        });
                    });
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                    accuracy = position.coords.accuracy;
                } catch (err) {
                    console.warn('Геолокация недоступна:', err);
                }

                window.fabric.Image.fromURL(dataURL, (img: any) => {
                    img.set({
                        left: 100,
                        top: 100,
                        scaleX: 0.5,
                        scaleY: 0.5,
                        geoData: { latitude, longitude, accuracy }
                    });

                    canvas.add(img);
                    saveAnnotation(img, 'image', { latitude, longitude, accuracy });
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
        actions: { addShape, addPhotoFromPC, deleteSelected },
        onPhotoClick,
        canvasInstance,
        resizeCanvas
    };
};