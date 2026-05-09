// src/types/fabric.d.ts

export interface FabricObjectOptions {
    left?: number;
    top?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    id?: number | string; // Наш кастомный ID
    width?: number;
    height?: number;
    fontSize?: number;
}

export interface FabricLineOptions extends FabricObjectOptions {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
}

export interface FabricImageOptions extends FabricObjectOptions {
    src?: string;
}

// Базовый интерфейс для любого объекта на холсте
export interface IFabricObject {
    type: string;
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    width?: number;
    height?: number;

    // Методы
    get(key: string): any;
    set(key: string, value: any): void;
    set(options: Partial<IFabricObject>): void;
    getSrc?(): string; // Только для изображений
}

// Интерфейс для события
export interface FabricEvent {
    target: IFabricObject;
}

// Интерфейс для самого Canvas
export interface IFabricCanvas {
    getWidth(): number;
    getHeight(): number;
    setBackgroundImage(image: IFabricImage, callback: () => void): void;
    setDimensions(dimensions: { width: number; height: number }): void;
    renderAll(): void;
    add(object: IFabricObject): void;
    remove(object: IFabricObject): void;
    dispose(): void;
    setActiveObject(object: IFabricObject): void;
    getActiveObjects(): IFabricObject[];
    discardActiveObject(): IFabricCanvas;
    on(event: string, callback: (e: FabricEvent) => void): void;
}

// Интерфейс для изображения
export interface IFabricImage extends IFabricObject {
    scale(scale: number): void;
}

// Глобальный объект fabric
declare global {
    interface Window {
        fabric: {
            Canvas: new (element: HTMLCanvasElement, options?: any) => IFabricCanvas;
            Image: {
                fromURL(url: string, callback: (img: IFabricImage) => void): void;
                new (element: HTMLImageElement, options?: FabricImageOptions): IFabricImage;
            };
            Rect: new (options?: FabricObjectOptions) => IFabricObject;
            Line: new (points: [number, number, number, number], options?: FabricLineOptions) => IFabricObject;
            Textbox: new (text: string, options?: FabricObjectOptions) => IFabricObject;
        };
    }
}

// Экспортируем тип для удобства использования в импортах, если нужно
export type FabricType = typeof window.fabric;