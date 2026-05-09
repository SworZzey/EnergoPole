import { db } from '../db/database';
import type { Project, Schema, Annotation, Note, Photo } from '../db/database';

// Проекты
export const dbService = {
    // Проекты
    async addProject(project: Omit<Project, 'id'>): Promise<number> {
        return await db.projects.add(project);
    },

    async getProjects(): Promise<Project[]> {
        return await db.projects.toArray();
    },

    async getDownloadedProjects(): Promise<Project[]> {
        return await db.projects.where('isDownloaded').equals(1).toArray();
    },

    async updateProject(id: number, updates: Partial<Project>) {
        await db.projects.update(id, updates);
    },

    async deleteProject(id: number) {
        // Каскадное удаление связанных данных
        await db.schemas.where('projectId').equals(id).delete();
        await db.annotations.where('projectId').equals(id).delete();
        await db.notes.where('projectId').equals(id).delete();
        await db.photos.where('projectId').equals(id).delete();
        await db.projects.delete(id);
    },

    async deleteSchema(schemaId: number): Promise<void> {
        // Используем транзакцию, чтобы гарантировать целостность данных
        await db.transaction('rw', db.schemas, db.annotations, async () => {
            // 1. Удаляем все аннотации, привязанные к этой схеме
            await db.annotations.where('schemaId').equals(schemaId).delete();

            // 2. Удаляем саму схему
            await db.schemas.delete(schemaId);
        });
    },

    // Схемы
    async addSchema(schema: Omit<Schema, 'id'>): Promise<number> {
        return await db.schemas.add(schema);
    },

    async getSchemasByProject(projectId: number): Promise<Schema[]> {
        return await db.schemas.where('projectId').equals(projectId).toArray();
    },

    async getSchemaById(id: number): Promise<Schema | undefined> {
        return await db.schemas.get(id);
    },

    async getSchemaBlob(schemaId: number): Promise<Blob | undefined> {
        const schema = await db.schemas.get(schemaId);
        return schema?.imageBlob;
    },

    async deleteSchemasByProject(projectId: number) {
        await db.schemas.where('projectId').equals(projectId).delete();
    },

    // Аннотации (пометки на схемах)
    async addAnnotation(annotation: Omit<Annotation, 'id'>): Promise<number> {
        return await db.annotations.add(annotation);
    },

    async getAnnotationsBySchema(schemaId: number): Promise<Annotation[]> {
        return await db.annotations.where('schemaId').equals(schemaId).toArray();
    },

    async updateAnnotation(id: number, updates: Partial<Annotation>) {
        await db.annotations.update(id, updates);
    },

    async deleteAnnotation(id: number) {
        await db.annotations.delete(id);
    },

    async deleteAnnotationsBySchema(schemaId: number) {
        await db.annotations.where('schemaId').equals(schemaId).delete();
    },

    // Замечания
    async addNote(note: Omit<Note, 'id'>): Promise<number> {
        return await db.notes.add({ ...note, syncStatus: 'pending' });
    },

    async getNotesByProject(projectId: number): Promise<Note[]> {
        return await db.notes.where('projectId').equals(projectId).toArray();
    },

    async getPendingNotes(): Promise<Note[]> {
        return await db.notes.where('syncStatus').equals('pending').toArray();
    },

    async updateNote(id: number, updates: Partial<Note>) {
        await db.notes.update(id, updates);
    },

    async markNoteSynced(id: number) {
        await db.notes.update(id, { syncStatus: 'synced' });
    },

    // Фото
    async addPhoto(photo: Omit<Photo, 'id'>): Promise<number> {
        return await db.photos.add({ ...photo, syncStatus: 'pending' });
    },

    async getPhotosByProject(projectId: number): Promise<Photo[]> {
        return await db.photos.where('projectId').equals(projectId).toArray();
    },

    async getPhotosByNote(noteId: number): Promise<Photo[]> {
        return await db.photos.where('noteId').equals(noteId).toArray();
    },

    async getPendingPhotos(): Promise<Photo[]> {
        return await db.photos.where('syncStatus').equals('pending').toArray();
    },

    async markPhotoSynced(id: number) {
        await db.photos.update(id, { syncStatus: 'synced' });
    },

    async deletePhoto(id: number) {
        await db.photos.delete(id);
    },

    // Общие методы для синхронизации
    async getAllPendingData() {
        const pendingNotes = await this.getPendingNotes();
        const pendingPhotos = await this.getPendingPhotos();
        return { pendingNotes, pendingPhotos };
    },

    async clearAllData() {
        await db.projects.clear();
        await db.schemas.clear();
        await db.annotations.clear();
        await db.notes.clear();
        await db.photos.clear();
    },
};