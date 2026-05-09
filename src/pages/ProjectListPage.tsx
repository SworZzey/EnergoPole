// src/pages/ProjectListPage.tsx
import React from 'react';
import ProjectList from '../components/ProjectList/ProjectList';
import OnlineStatus from '../components/OnlineStatus';
import type { Project } from '../db/database';

interface ProjectListPageProps {
    onSelectProject: (project: Project) => void; // Изменили сигнатуру
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ onSelectProject }) => {

    // ProjectList теперь должен возвращать объект Project, а не ID схемы
    const handleSelectProject = (project: Project) => {
        onSelectProject(project);
    };

    return (
        <div className="page-container">
            <OnlineStatus />
            <ProjectList onSelectProject={handleSelectProject} />
        </div>
    );
};

export default ProjectListPage;