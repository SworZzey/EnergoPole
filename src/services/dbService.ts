//Функции работы с БД
import { db, generateObjectId } from '../db/database';
import type { Project, Schema, Annotation, Note, Photo, Task } from '../db/database';

// Проекты
export const dbService = {
    // Проекты
    async addProject(project: Omit<Project, 'id'>): Promise<string> {
        const id = generateObjectId();
        const newProject = { ...project, id };
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                await fetch('/api/projects/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: project.name, description: project.description })
                });
            }
        } catch (e) {
            console.error('Sync add project error', e);
        }
        await db.projects.add(newProject);
        return id;
    },

    async getProjects(): Promise<Project[]> {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                const res = await fetch('/api/projects/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const serverObjects = await res.json();
                    for (const obj of serverObjects) {
                        const existing = await db.projects.get(obj.id);
                        if (!existing) {
                            await db.projects.add({
                                id: obj.id,
                                name: obj.name,
                                description: obj.description || '',
                                isDownloaded: 1
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Sync get projects error', e);
        }
        return await db.projects.toArray();
    },

    async getDownloadedProjects(): Promise<Project[]> {
        return await db.projects.where('isDownloaded').equals(1).toArray();
    },

    async updateProject(id: string, updates: Partial<Project>) {
        await db.projects.update(id, updates);
    },

    async deleteProject(id: string): Promise<void> {
        if (!id) throw new Error("ID проекта не указан");

        try {
            // @ts-ignore: Dexie TS types limit overloads to 5 tables, but runtime supports more
            await db.transaction('rw', db.projects, db.schemas, db.annotations, db.notes, db.photos, async () => {
                await db.schemas.where('projectId').equals(id).delete();
                await db.annotations.where('projectId').equals(id).delete();
                await db.notes.where('projectId').equals(id).delete();
                await db.photos.where('projectId').equals(id).delete();
                await db.projects.delete(id);
            });
        } catch (error) {
            console.error("Ошибка при удалении проекта:", error);
            throw error;
        }
    },

    async deleteSchema(schemaId: string): Promise<void> {
        // Используем транзакцию, чтобы гарантировать целостность данных
        await db.transaction('rw', db.schemas, db.annotations, async () => {
            // Удаляем все аннотации, привязанные к этой схеме
            await db.annotations.where('schemaId').equals(schemaId).delete();

            // Удаляем саму схему
            await db.schemas.delete(schemaId);
        });
    },

    // Схемы
    async addSchema(schema: Omit<Schema, 'id'>): Promise<string> {
        const id = generateObjectId();
        await db.schemas.add({ ...schema, id });
        return id;
    },

    async getSchemasByProject(projectId: string): Promise<Schema[]> {
        return await db.schemas.where('projectId').equals(projectId).toArray();
    },

    async getSchemaById(id: string): Promise<Schema | undefined> {
        return await db.schemas.get(id);
    },

    async getSchemaBlob(schemaId: string): Promise<Blob | undefined> {
        const schema = await db.schemas.get(schemaId);
        return schema?.imageBlob;
    },

    async deleteSchemasByProject(projectId: string) {
        await db.schemas.where('projectId').equals(projectId).delete();
    },

    // Аннотации (пометки на схемах)
    async addAnnotation(annotation: Omit<Annotation, 'id'>): Promise<string> {
        const id = generateObjectId();
        await db.annotations.add({ ...annotation, id });
        return id;
    },

    async getAnnotationsBySchema(schemaId: string): Promise<Annotation[]> {
        return await db.annotations.where('schemaId').equals(schemaId).toArray();
    },

    async updateAnnotation(id: string, updates: Partial<Annotation>) {
        await db.annotations.update(id, updates);
    },

    async deleteAnnotation(id: string) {
        await db.annotations.delete(id);
    },

    async deleteAnnotationsBySchema(schemaId: string) {
        await db.annotations.where('schemaId').equals(schemaId).delete();
    },

    // Замечания
    async addNote(note: Omit<Note, 'id'>): Promise<string> {
        const id = generateObjectId();
        await db.notes.add({ ...note, id, syncStatus: 'pending' });
        return id;
    },

    async getNotesByProject(projectId: string): Promise<Note[]> {
        return await db.notes.where('projectId').equals(projectId).toArray();
    },

    async getPendingNotes(): Promise<Note[]> {
        return await db.notes.where('syncStatus').equals('pending').toArray();
    },

    async updateNote(id: string, updates: Partial<Note>) {
        await db.notes.update(id, updates);
    },

    async markNoteSynced(id: string) {
        await db.notes.update(id, { syncStatus: 'synced' });
    },

    // Фото
    async addPhoto(photo: Omit<Photo, 'id'>): Promise<string> {
        const id = generateObjectId();
        await db.photos.add({ ...photo, id, syncStatus: 'pending' });
        return id;
    },

    async getPhotosByProject(projectId: string): Promise<Photo[]> {
        return await db.photos.where('projectId').equals(projectId).toArray();
    },

    async getPhotosByNote(noteId: string): Promise<Photo[]> {
        return await db.photos.where('noteId').equals(noteId).toArray();
    },

    async getPendingPhotos(): Promise<Photo[]> {
        return await db.photos.where('syncStatus').equals('pending').toArray();
    },

    async markPhotoSynced(id: string) {
        await db.photos.update(id, { syncStatus: 'synced' });
    },

    async deletePhoto(id: string) {
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

    async getTasksByProject(projectId: string): Promise<Task[]> {
        return await db.tasks.where('projectId').equals(projectId).sortBy('createdAt');
    },

    async addTask(task: Omit<Task, 'id' | 'createdAt' | 'syncStatus'>): Promise<string> {
        const id = generateObjectId();
        await db.tasks.add({
            ...task,
            id,
            createdAt: new Date(),
            syncStatus: 'pending'
        });
        return id;
    },

    async updateTaskStatus(id: string, status: Task['status']): Promise<void> {
        await db.tasks.update(id, { status });
    },

    async deleteTask(id: string): Promise<void> {
        await db.tasks.delete(id);
    }
};