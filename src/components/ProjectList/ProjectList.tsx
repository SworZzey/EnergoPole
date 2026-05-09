import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import type { Project } from '../../db/database';
import styles from './ProjectList.module.css';
import ProjectForm from '../ProjectForm/ProjectForm.tsx';
import ProjectItem from '../ProjectItem/ProjectItem.tsx';

interface ProjectListProps {
    onSelectProject: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject }) => {
    const [projects, setProjects] = useState<Project[]>([]);

    const loadProjects = async () => {
        const list = await dbService.getProjects();
        setProjects(list);
    };

    useEffect(() => {
        loadProjects();
    }, []);

    // Хелпер для удаления элемента из стейта без полной перезагрузки (для отзывчивости UI)
    const handleProjectDeleted = () => {
        loadProjects();
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Проекты обследования</h1>

            <ProjectForm onProjectAdded={loadProjects} />

            {projects.length === 0 && <p className={styles.emptyMessage}>Нет проектов. Создайте первый.</p>}

            <ul className={styles.projectList}>
                {projects.map((proj) => (
                    <ProjectItem
                        key={proj.id}
                        project={proj}
                        onDelete={handleProjectDeleted}
                        onOpenProject={onSelectProject}
                    />
                ))}
            </ul>
        </div>
    );
};

export default ProjectList;