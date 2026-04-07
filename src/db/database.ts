import Dexie from 'dexie';

// Типы данных (без изменений)
export interface Project {
    id?: number;
    name: string;
    description: string;
    lastSyncAt?: Date;
    isDownloaded: number;
}

export interface Schema {
    id?: number;
    projectId: number;
    name: string;
    imageBlob: Blob;
    originalUrl: string;
    width?: number;
    height?: number;
}

export interface Annotation {
    id?: number;
    schemaId: number;
    projectId: number;
    type: 'rect' | 'arrow' | 'text' | 'freehand' | 'image';
    coordinates: string;
    content?: string;
    color?: string;
    createdAt: Date;
}

export interface Note {
    id?: number;
    projectId: number;
    schemaId?: number;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'closed';
    annotationIds?: string;
    photoIds?: string;
    syncStatus: 'pending' | 'synced' | 'error';
    createdAt: Date;
    updatedAt: Date;
}

export interface Photo {
    id?: number;
    projectId: number;
    noteId?: number;
    imageBlob: Blob;
    thumbnailBlob?: Blob;
    latitude: number | null;
    longitude: number | null;
    timestamp: Date;
    syncStatus: 'pending' | 'synced' | 'error';
}

// Класс базы данных — используем Dexie.Table как тип
export class EnergopoleDB extends Dexie {
    projects!: Dexie.Table<Project, number>;
    schemas!: Dexie.Table<Schema, number>;
    annotations!: Dexie.Table<Annotation, number>;
    notes!: Dexie.Table<Note, number>;
    photos!: Dexie.Table<Photo, number>;

    constructor() {
        super('EnergopoleDB');
        this.version(1).stores({
            projects: '++id, name, isDownloaded, lastSyncAt',
            schemas: '++id, projectId, name',
            annotations: '++id, schemaId, projectId, type, createdAt',
            notes: '++id, projectId, status, syncStatus, createdAt',
            photos: '++id, projectId, noteId, syncStatus, timestamp',
        });
    }
}

export const db = new EnergopoleDB();