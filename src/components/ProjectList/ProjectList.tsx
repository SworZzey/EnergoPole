// src/components/ProjectList/ProjectList.tsx
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import type { Project } from '../../db/database';
import styles from './ProjectList.module.css';
import ProjectForm from '../ProjectForm/ProjectForm.tsx';
import ProjectItem from '../ProjectItem/ProjectItem.tsx';

interface ProjectListProps {
    onSelectProject: (project: Project) => void;
    onViewTasks?: (project: Project) => void;
    userRole?: 'engineer' | 'manager'; // 👈 Новый проп
}

const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject, userRole = 'engineer', onViewTasks}) => {
    const [projects, setProjects] = useState<Project[]>([]);

    const loadProjects = async () => {
        const list = await dbService.getProjects();
        setProjects(list);
    };

    useEffect(() => {
        loadProjects();
    }, []);

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
                        onViewTasks={onViewTasks}
                        userRole={userRole}
                    />
                ))}
            </ul>
        </div>
    );
};

export default ProjectList;