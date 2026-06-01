//Список задач проекта
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import type { Task } from '../../db/database';
import styles from './ProjectTasksList.module.css';
import TaskGeoView from '../TaskGeoView/TaskGeoView';

interface ProjectTasksListProps {
    projectId: string;
    onBack: () => void;
    onCreateTask?: () => void;
}

const ProjectTasksList: React.FC<ProjectTasksListProps> = ({ projectId, onBack, onCreateTask }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dbService.getTasksByProject(projectId).then(setTasks).finally(() => setLoading(false));
    }, [projectId]);

    const toggleStatus = async (id: string, currentStatus: Task['status']) => {
        const next = currentStatus === 'open' ? 'in_progress' : currentStatus === 'in_progress' ? 'closed' : 'open';
        await dbService.updateTaskStatus(id, next);
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: next } : t));
    };

    return (
        <div className="page-container">
            <div className={styles.tlbHeader}>
                <button onClick={onBack} className={styles.backButton}>← Назад</button>
                <h2 className={styles.blkHeader}>Задачи проекта</h2>
            </div>

            {loading ? <p>Загрузка...</p> : (
                <>
                    {onCreateTask && (
                        <div className={styles.btnHeader}>
                            <button onClick={onCreateTask} className={styles.addButton} style={{marginTop: 20}}>
                                Создать новую задачу
                            </button>
                        </div>
                    )}
                    <ul className={styles.taskList}>
                        {tasks.map(task => (
                            <li key={task.id} className={`${styles.taskCard} ${styles[`status-${task.status}`]}`}>
                                <div className={styles.taskHeader}>
                                    <h3>{task.title}</h3>
                                    <span className={styles.badge}>{task.status}</span>
                                </div>
                                <p className={styles.description}>{task.description}</p>

                                <TaskGeoView
                                    latitude={task.latitude ?? null}
                                    longitude={task.longitude ?? null}
                                    taskTitle={task.title}
                                />

                                <button onClick={() => toggleStatus(task.id!, task.status)}
                                        className={styles.statusButton}>
                                    Сменить статус
                                </button>
                            </li>
                        ))}
                    </ul>
                    {tasks.length === 0 && <p className={styles.noTasks}>Задач пока нет.</p>}
                </>
            )}
        </div>
    );
};

export default ProjectTasksList;