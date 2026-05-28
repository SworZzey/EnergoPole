// src/components/ProjectList/ProjectItem.tsx
import React from 'react';
import { dbService } from '../../services/dbService';
import styles from './ProjectItem.module.css';
import type { Project } from '../../db/database';

interface ProjectItemProps {
    project: Project;
    onDelete: () => void;
    onOpenProject: (project: Project) => void;
    onViewTasks?: (project: Project) => void; // 👈 Объявили
    userRole?: 'engineer' | 'manager';
}

const ProjectItem: React.FC<ProjectItemProps> = ({
                                                     project,
                                                     onDelete,
                                                     onOpenProject,
                                                     onViewTasks,
                                                     userRole = 'engineer'
                                                 }) => {

    const handleUploadSchema = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const blob = new Blob([file], { type: file.type });
                await dbService.addSchema({
                    projectId: project.id!,
                    name: file.name,
                    imageBlob: blob,
                    originalUrl: '',
                });

                alert(`Схема "${file.name}" загружена`);
            } catch (error) {
                console.error("Ошибка загрузки схемы", error);
                alert("Не удалось загрузить схему");
            }
        };

        input.click();
    };

    const handleDelete = async () => {
        if (!window.confirm('Удалить проект и все связанные данные (схемы, аннотации, фото)?')) {
            return;
        }
        try {
            await dbService.deleteProject(project.id!);

            onDelete();
        } catch (error) {
            console.error(error);
            alert("Не удалось удалить проект. Проверьте консоль.");

        }
    };

    return (
        <li key={project.id} className={styles.projectItem}>
            <h3 className={styles.projectTitle}>{project.name}</h3>
            <p className={styles.projectDescription}>{project.description}</p>

            <div className={styles.buttonGroup}>
                {userRole === 'manager' ? (
                    // === КНОПКИ ДЛЯ МЕНЕДЖЕРА ===
                    <button
                        onClick={() => onOpenProject(project)}
                        className={styles.openButton}
                        style={{
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            borderColor: 'var(--accent-secondary)',
                            color: 'var(--accent-secondary)'
                        }}
                    >
                        📋 Задачи
                    </button>
                ) : (
                    // === КНОПКИ ДЛЯ ИНЖЕНЕРА ===
                    <>
                        {/* 👇 Новая кнопка "Задачи" для инженера */}
                        {onViewTasks && (
                            <button
                                onClick={() => onViewTasks(project)}
                                className={styles.openButton}
                                style={{
                                    backgroundColor: 'rgba(45, 212, 191, 0.1)',
                                    borderColor: 'var(--accent-primary)',
                                    color: 'var(--accent-primary)'
                                }}
                            >
                                📋 Задачи
                            </button>
                        )}

                        <button
                            onClick={() => onOpenProject(project)}
                            className={styles.openButton}
                        >
                            📂 Открыть
                        </button>

                        <button
                            onClick={handleUploadSchema}
                            className={styles.schemaButton}
                        >
                            📷 Загрузить схему
                        </button>
                    </>
                )}

                {/* Кнопка удаления общая для всех */}
                <button
                    onClick={handleDelete}
                    className={styles.deleteButton}
                >
                    🗑️ Удалить
                </button>
            </div>
        </li>
    );
};

export default ProjectItem;