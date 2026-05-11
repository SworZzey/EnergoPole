// src/App.tsx
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage/LoginPage.tsx';
import ProjectListPage from './pages/ProjectListPage';
import SchemaListPage from './pages/SchemaListPage/SchemaListPage.tsx';
import SchemaEditorPage from './pages/SchemaEditor';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import type { Schema, Project } from './db/database';

// Типы экранов для навигации - добавили LOGIN
type Screen = 'LOGIN' | 'PROJECTS' | 'SCHEMAS' | 'EDITOR';

function App() {
    const [screen, setScreen] = useState<Screen>('LOGIN'); // Начальный экран - LOGIN

    // Данные для навигации
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [currentSchema, setCurrentSchema] = useState<Schema | null>(null);
    const [schemaRefreshTrigger, setSchemaRefreshTrigger] = useState(0);

    // Проверка авторизации при загрузке приложения
    useEffect(() => {
        if (authService.isAuthenticated()) {
            setScreen('PROJECTS');
        }
    }, []);

    // --- Навигационные хендлеры ---

    // Успешный вход - переход к проектам
    const handleLoginSuccess = () => {
        setScreen('PROJECTS');
    };

    // Выход из системы
    const handleLogout = () => {
        authService.logout();
        setScreen('LOGIN');
        setCurrentProject(null);
        setCurrentSchema(null);
    };

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
    const handleAddSchemaRequest = async () => {
        if (!currentProject) return;

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

    // Компонент-обертка с кнопкой выхода для внутренних экранов
    const MainLayout = ({ children }: { children: React.ReactNode }) => (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            {/* Кнопка выхода в правом верхнем углу */}
            <button
                onClick={handleLogout}
                style={{
                    position: 'fixed',
                    top: 16,
                    right: 16,
                    zIndex: 1000,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--accent-error)',
                    color: 'var(--accent-error)',
                    padding: '8px 16px',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-error)';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = 'var(--accent-error)';
                }}
            >
                🚪 Выйти
            </button>

            {children}
        </div>
    );

    // --- Рендеринг экранов ---

    // Экран входа - рендерим без обертки
    if (screen === 'LOGIN') {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    // Все внутренние экраны - рендерим с кнопкой выхода
    return (
        <MainLayout>
            {screen === 'PROJECTS' && (
                <ProjectListPage onSelectProject={handleSelectProject} />
            )}

            {screen === 'SCHEMAS' && currentProject && (
                <SchemaListPage
                    projectId={currentProject.id!}
                    projectName={currentProject.name}
                    onSelectSchema={handleSelectSchema}
                    onBack={handleBackToProjects}
                    onAddSchema={handleAddSchemaRequest}
                    refreshTrigger={schemaRefreshTrigger}
                />
            )}

            {screen === 'EDITOR' && currentSchema && currentProject && (
                <SchemaEditorPage
                    schema={currentSchema}
                    projectId={currentProject.id!}
                    onBack={handleBackToSchemas}
                />
            )}
        </MainLayout>
    );
}

export default App;