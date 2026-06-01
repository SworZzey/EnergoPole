// Форма создания проекта
import React, { useState } from 'react';
import { dbService } from '../../services/dbService';
import styles from './ProjectForm.module.css';

interface ProjectFormProps {
    onProjectAdded: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onProjectAdded }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async () => {
        if (!name.trim()) return;

        await dbService.addProject({
            name,
            description,
            isDownloaded: 0,
        });

        setName('');
        setDescription('');
        onProjectAdded();
    };

    return (
        <div className={styles.formContainer}>
            <input
                type="text"
                placeholder="Название проекта"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
            />
            <input
                type="text"
                placeholder="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.input}
            />
            <button onClick={handleSubmit} className={styles.button}>
                Добавить проект
            </button>
        </div>
    );
};

export default ProjectForm;