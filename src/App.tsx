// src/App.tsx
import { useState } from 'react';
import ProjectListPage from './pages/ProjectListPage';
import SchemaListPage from './pages/SchemaListPage/SchemaListPage.tsx';
import SchemaEditorPage from './pages/SchemaEditor';
import { dbService } from './services/dbService';
import type { Schema, Project } from './db/database';

// Типы экранов для навигации
type Screen = 'PROJECTS' | 'SCHEMAS' | 'EDITOR';

function App() {
    const [screen, setScreen] = useState<Screen>('PROJECTS');

    // Данные для навигации
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [currentSchema, setCurrentSchema] = useState<Schema | null>(null);


    const [schemaRefreshTrigger, setSchemaRefreshTrigger] = useState(0);

    // --- Навигационные хендлеры ---

    // 1. Выбор проекта (из ProjectListPage)
    const handleSelectProject = (project: Project) => {
        setCurrentProject(project);
        setScreen('SCHEMAS');
    };

    // 2. Выбор схемы (из SchemaListPage)
    const handleSelectSchema = (schema: Schema) => {
        setCurrentSchema(schema);
        setScreen('EDITOR');
    };

    // 3. Кнопка "Назад" из списка схем к проектам
    const handleBackToProjects = () => {
        setCurrentProject(null);
        setScreen('PROJECTS');
    };

    // 4. Кнопка "Назад" из редактора к списку схем
    const handleBackToSchemas = () => {
        setCurrentSchema(null);
        setScreen('SCHEMAS');
    };

    // 5. Добавление новой схемы (вызов диалога загрузки)
    // Эту логику лучше вынести в SchemaListPage, но для простоты передадим колбэк
    const handleAddSchemaRequest = async () => {
        if (!currentProject) return;

        // Логика загрузки файла (та же, что была в ProjectItem)
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const blob = new Blob([file], { type: file.type });
            try {
                await dbService.addSchema({
                    projectId: currentProject.id!,
                    name: file.name,
                    imageBlob: blob,
                    originalUrl: '',
                });

                alert('Схема добавлена');


                setSchemaRefreshTrigger(prev => prev + 1);
            } catch (err) {
                alert('Ошибка при добавлении схемы');
            }
        };
        input.click();
    };

    // --- Рендеринг экранов ---

    if (screen === 'PROJECTS') {
        return <ProjectListPage onSelectProject={handleSelectProject} />;
    }

    if (screen === 'SCHEMAS' && currentProject) {
        return (
            <SchemaListPage
                projectId={currentProject.id!}
                projectName={currentProject.name}
                onSelectSchema={handleSelectSchema}
                onBack={handleBackToProjects}
                onAddSchema={handleAddSchemaRequest}
                refreshTrigger={schemaRefreshTrigger}
            />
        );
    }

    if (screen === 'EDITOR' && currentSchema && currentProject) {
        return (
            <SchemaEditorPage
                schema={currentSchema}
                projectId={currentProject.id!}
                onBack={handleBackToSchemas}
            />
        );
    }

    // Fallback
    return <div>Ошибка навигации</div>;
}

export default App;