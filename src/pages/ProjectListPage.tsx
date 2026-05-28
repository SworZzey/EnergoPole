// src/pages/ProjectListPage.tsx
import React from 'react';
import ProjectList from '../components/ProjectList/ProjectList';
import OnlineStatus from '../components/OnlineStatus';
import type { Project } from '../db/database';

interface ProjectListPageProps {
    onSelectProject: (project: Project) => void;
    onViewTasks?: (project: Project) => void;
    userRole?: 'engineer' | 'manager';
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ onSelectProject, userRole = 'engineer', onViewTasks}) => {
    return (
        <div className="page-container">
            <ProjectList
                onSelectProject={onSelectProject}
                onViewTasks={onViewTasks}
                userRole={userRole}
            />
            <OnlineStatus />
        </div>
    );
};

export default ProjectListPage;