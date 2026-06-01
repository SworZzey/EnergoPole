import Dexie from 'dexie';

// Helper to generate 24-char hex string (MongoDB ObjectId format)
export function generateObjectId(): string {
    return [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Типы данных
export interface Project {
    id?: string;
    name: string;
    description: string;
    lastSyncAt?: Date;
    isDownloaded: number;
}

export interface Schema {
    id?: string;
    projectId: string;
    name: string;
    imageBlob: Blob;
    originalUrl: string;
    width?: number;
    height?: number;
}

export interface Annotation {
    id?: string;
    schemaId: string;
    projectId: string;
    type: 'rect' | 'arrow' | 'text' | 'freehand' | 'image';
    coordinates: string;
    content?: string;
    color?: string;
    createdAt: Date;
    latitude?: number | null;
    longitude?: number | null;
    geoAccuracy?: number | null; // Точность в метрах
    geoCapturedAt?: Date | null; // Время захвата координат
}

export interface Note {
    id?: string;
    projectId: string;
    schemaId?: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'closed';
    annotationIds?: string[];
    photoIds?: string[];
    syncStatus: 'pending' | 'synced' | 'error';
    createdAt: Date;
    updatedAt: Date;
}

export interface Task {
    id?: string;
    projectId: string;
    title: string;
    description: string;
    photoBlob?: Blob | null;
    latitude?: number | null;
    longitude?: number | null;
    status: 'open' | 'in_progress' | 'closed';
    createdBy: 'manager';
    createdAt: Date;
    syncStatus: 'pending' | 'synced';
}

export interface Photo {
    id?: string;
    projectId: string;
    noteId?: string;
    imageBlob: Blob;
    thumbnailBlob?: Blob;
    latitude: number | null;
    longitude: number | null;
    timestamp: Date;
    syncStatus: 'pending' | 'synced' | 'error';
}

// Класс базы данных
export class EnergopoleDB extends Dexie {
    projects!: Dexie.Table<Project, string>;
    schemas!: Dexie.Table<Schema, string>;
    annotations!: Dexie.Table<Annotation, string>;
    notes!: Dexie.Table<Note, string>;
    photos!: Dexie.Table<Photo, string>;
    tasks!: Dexie.Table<Task, string>;

    constructor() {
        super('EnergopoleDB_v4');
        
        // Версия 4 сбрасывает БД и использует строковые ID
        this.version(4).stores({
            projects: 'id, name, isDownloaded, lastSyncAt',
            schemas: 'id, projectId, name',
            annotations: 'id, schemaId, projectId, type, createdAt, latitude, longitude',
            notes: 'id, projectId, status, syncStatus, createdAt',
            photos: 'id, projectId, noteId, syncStatus, timestamp',
            tasks: 'id, projectId, status, syncStatus, createdAt',
        });
    }
}

export const db = new EnergopoleDB();