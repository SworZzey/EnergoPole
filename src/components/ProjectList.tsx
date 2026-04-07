// src/components/ProjectList.tsx
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import type { Project, Schema } from '../db/database';

interface ProjectListProps {
    onSelectProject: (projectId: number, schemaId: number) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

    const loadProjects = async () => {
        const list = await dbService.getProjects();
        setProjects(list);
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const addProject = async () => {
        if (!newProjectName.trim()) return;
        await dbService.addProject({
            name: newProjectName,
            description: newProjectDesc,
            isDownloaded: 0,
        });
        setNewProjectName('');
        setNewProjectDesc('');
        loadProjects();
    };

    const deleteProject = async (id: number) => {
        if (confirm('Удалить проект и все связанные данные (схемы, аннотации, фото)?')) {
            await dbService.deleteProject(id);
            loadProjects();
        }
    };

    const uploadSchema = async (projectId: number) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const blob = new Blob([file], { type: file.type });
            const schemaId = await dbService.addSchema({
                projectId,
                name: file.name,
                imageBlob: blob,
                originalUrl: '',
            });
            alert(`Схема "${file.name}" загружена`);
            // После загрузки можно сразу открыть эту схему
            onSelectProject(projectId, schemaId);
        };
        input.click();
    };

    const openProject = async (projectId: number) => {
        const schemas = await dbService.getSchemasByProject(projectId);
        if (schemas.length === 0) {
            const confirmUpload = confirm('В проекте нет схем. Загрузить схему сейчас?');
            if (confirmUpload) {
                await uploadSchema(projectId);
            }
        } else {
            // Если есть несколько схем, пока берем первую (можно потом сделать выбор)
            onSelectProject(projectId, schemas[0].id!);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Проекты обследования</h1>
            <div style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Название проекта"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Описание"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                />
                <button onClick={addProject}>➕ Добавить проект</button>
            </div>
            {projects.length === 0 && <p>Нет проектов. Создайте первый.</p>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {projects.map((proj) => (
                    <li key={proj.id} style={{ border: '1px solid #ccc', marginBottom: 10, padding: 10, borderRadius: 8 }}>
                        <h3>{proj.name}</h3>
                        <p>{proj.description}</p>
                        <button onClick={() => openProject(proj.id!)}>📂 Открыть</button>
                        <button onClick={() => uploadSchema(proj.id!)} style={{ marginLeft: 10 }}>📷 Загрузить схему</button>
                        <button onClick={() => deleteProject(proj.id!)} style={{ marginLeft: 10, backgroundColor: '#ffcccc' }}>🗑️ Удалить</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProjectList;