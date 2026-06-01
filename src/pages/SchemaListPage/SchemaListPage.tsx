// Список схем проекта
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService.ts';
import type { Schema } from '../../db/database.ts';
import OnlineStatus from '../../components/OnlineStatus.tsx';
import styles from './SchemaListPage.module.css';

interface SchemaListPageProps {
    projectId: number;
    projectName: string;
    onSelectSchema: (schema: Schema) => void;
    onBack: () => void;
    onAddSchema: () => void;
    refreshTrigger?: number;
}

const SchemaListPage: React.FC<SchemaListPageProps> = ({
                                                           projectId,
                                                           projectName,
                                                           onSelectSchema,
                                                           onBack,
                                                           onAddSchema,
                                                           refreshTrigger
                                                       }) => {
    const [schemas, setSchemas] = useState<Schema[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSchemas = async () => {
            setLoading(true);
            try {
                const list = await dbService.getSchemasByProject(projectId);
                setSchemas(list);
            } catch (e) {
                console.error("Error loading schemas", e);
            } finally {
                setLoading(false);
            }
        };

        loadSchemas();
    }, [projectId, refreshTrigger]);

    //обработчик удаления
    const handleDeleteSchema = async (e: React.MouseEvent, schemaId: number) => {
        e.stopPropagation();

        if (!window.confirm('Вы уверены, что хотите удалить эту схему? Все аннотации будут потеряны.')) {
            return;
        }

        try {
            await dbService.deleteSchema(schemaId);
            setSchemas(prev => prev.filter(s => s.id !== schemaId));
        } catch (error) {
            console.error("Failed to delete schema", error);
            alert("Не удалось удалить схему");
        }
    };

    return (
        <div className="page-container">
            <div className={styles.tlbHeader}>
                <button onClick={onBack} className={styles.backButton}>← Назад к проектам</button>
                <h2 className={styles.prgName}>{projectName}</h2>
            </div>

            <div className={styles.controls}>
                <button onClick={onAddSchema} className={styles.addButton}>
                    Добавить новую схему
                </button>
            </div>

            {loading ? (
                <p>Загрузка схем...</p>
            ) : schemas.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>В этом проекте пока нет схем.</p>
                    <button onClick={onAddSchema}>Загрузить первую схему</button>
                </div>
            ) : (
                <ul className={styles.schemaList}>
                    {schemas.map((schema) => (
                        <li
                            key={schema.id}
                            className={styles.schemaItem}
                            onClick={() => onSelectSchema(schema)}
                        >
                            <div className={styles.schemaInfo}>
                                <h3>{schema.name}</h3>
                                <span>ID: {schema.id}</span>
                            </div>

                            <div className={styles.actions}>
                                {/* Кнопка удаления */}
                                <button
                                    className={styles.deleteButtonSmall}
                                    onClick={(e) => handleDeleteSchema(e, schema.id!)}
                                    title="Удалить схему"
                                >
                                    🗑️
                                </button>
                                <div className={styles.arrow}>→</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <OnlineStatus />
        </div>
    );
};

export default SchemaListPage;