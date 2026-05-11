import React from 'react';
import ProjectList from '../components/ProjectList/ProjectList';
import OnlineStatus from '../components/OnlineStatus';
import type { Project } from '../db/database';

interface ProjectListPageProps {
    onSelectProject: (project: Project) => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ onSelectProject }) => {

    // ProjectList должен возвращать объект Project
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