import React from 'react';
import ProjectList from '../../components/ProjectList/ProjectList';
import type { Project } from '../../db/database';

interface ManagerPageProps {
    onSelectProject: (project: Project) => void;
    onTaskCreated: () => void;
}

const ManagerPage: React.FC<ManagerPageProps> = ({ onSelectProject, onTaskCreated }) => {
    return (
        <div className="page-container">
            <h1>📊 Кабинет Менеджера</h1>
            <p>Создавайте проекты и задачи для инженеров</p>

            <ProjectList
                onSelectProject={onSelectProject}
                userRole="manager" // 👈 Менеджер видит кнопку "Задачи"
            />
        </div>
    );
};

export default ManagerPage;