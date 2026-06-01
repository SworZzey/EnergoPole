//ЛК менеджера
import React from 'react';
import ProjectList from '../../components/ProjectList/ProjectList';
import type { Project } from '../../db/database';
import styles from './ManagerPage.module.css'

interface ManagerPageProps {
    onSelectProject: (project: Project) => void;
    onTaskCreated: () => void;
}

const ManagerPage: React.FC<ManagerPageProps> = ({ onSelectProject, onTaskCreated }) => {
    return (
        <div className="page-container">
            <h1 className={styles.heads}>Кабинет Менеджера</h1>
            <p className={styles.subtitle}>Создавайте проекты и задачи для инженеров</p>

            <ProjectList
                onSelectProject={onSelectProject}
                userRole="manager"
            />
        </div>
    );
};

export default ManagerPage;