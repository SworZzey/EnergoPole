// src/App.tsx
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage/LoginPage.tsx';
import ManagerPage from './pages/ManagerPage/ManagerPage.tsx';
import ProjectListPage from './pages/ProjectListPage';
import SchemaListPage from './pages/SchemaListPage/SchemaListPage.tsx';
import SchemaEditorPage from './pages/SchemaEditor';
import ProjectTasksList from './components/ProjectTasksList/ProjectTasksList';
import TaskForm from './components/TaskForm/TaskForm';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import type { Schema, Project } from './db/database';

type Screen =
    | 'LOGIN'
    | 'ENGINEER_PROJECTS'
    | 'ENGINEER_SCHEMAS'
    | 'ENGINEER_EDITOR'
    | 'MANAGER_PROJECTS'
    | 'ENGINEER_TASKS'
    | 'MANAGER_TASKS';

function App() {
    const [screen, setScreen] = useState<Screen>('LOGIN');
    const [userRole, setUserRole] = useState<'engineer' | 'manager' | null>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);

    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [currentSchema, setCurrentSchema] = useState<Schema | null>(null);
    const [schemaRefreshTrigger, setSchemaRefreshTrigger] = useState(0);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setUserRole(user.role);
            setScreen(user.role === 'manager' ? 'MANAGER_PROJECTS' : 'ENGINEER_PROJECTS');
        }
    }, []);

    const handleLoginSuccess = () => {
        const user = authService.getCurrentUser();
        if (user?.role === 'manager') {
            setScreen('MANAGER_PROJECTS');
        } else {
            setScreen('ENGINEER_PROJECTS');
        }
    };

    const handleLogout = () => {
        authService.logout();
        setScreen('LOGIN');
        setUserRole(null);
    };

    const handleSelectProject = (project: Project) => {
        setCurrentProject(project);
        setScreen('ENGINEER_SCHEMAS');
    };

    const handleSelectSchema = (schema: Schema) => {
        setCurrentSchema(schema);
        setScreen('ENGINEER_EDITOR');
    };

    const handleBackToProjects = () => {
        setCurrentProject(null);
        setScreen('ENGINEER_PROJECTS');
    };

    const handleBackToSchemas = () => {
        setCurrentSchema(null);
        setScreen('ENGINEER_SCHEMAS');
    };

    const handleManagerSelectProject = (project: Project) => {
        setCurrentProject(project);
        setScreen('MANAGER_TASKS');
    };

    const handleManagerBackToProjects = () => {
        setCurrentProject(null);
        setScreen('MANAGER_PROJECTS');
    };

    const handleManagerTaskCreated = () => {
        setCurrentProject(null);
        setScreen('MANAGER_PROJECTS');
    };

    const handleEngineerViewTasks = (project: Project) => {
        setCurrentProject(project);
        setScreen('ENGINEER_TASKS');
    };

    const handleBackFromEngineerTasks = () => {
        setCurrentProject(null);
        setScreen('ENGINEER_PROJECTS');
    };

    const handleOpenTaskForm = () => {
        setShowTaskModal(true);
    };

    const handleTaskCreated = () => {
        setShowTaskModal(false);
        // Можно добавить обновление списка, если нужно
    };

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

    const MainLayout = ({ children }: { children: React.ReactNode }) => (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            <button
                onClick={handleLogout}
                style={{
                    position: 'fixed',
                    top: 16,
                    right: 24,
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

    // === РЕНДЕРИНГ ===

    if (screen === 'LOGIN') {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    // === ИНЖЕНЕР ===
    if (screen === 'ENGINEER_PROJECTS') {
        return (
            <MainLayout>
                <ProjectListPage
                    onSelectProject={handleSelectProject}
                    onViewTasks={handleEngineerViewTasks}
                    userRole="engineer"
                />
            </MainLayout>
        );
    }

    if (screen === 'ENGINEER_SCHEMAS' && currentProject) {
        return (
            <MainLayout>
                <SchemaListPage
                    projectId={currentProject.id!}
                    projectName={currentProject.name}
                    onSelectSchema={handleSelectSchema}
                    onBack={handleBackToProjects}
                    onAddSchema={handleAddSchemaRequest}
                    refreshTrigger={schemaRefreshTrigger}
                />
            </MainLayout>
        );
    }

    if (screen === 'ENGINEER_EDITOR' && currentSchema && currentProject) {
        return (
            <MainLayout>
                <SchemaEditorPage
                    schema={currentSchema}
                    projectId={currentProject.id!}
                    onBack={handleBackToSchemas}
                />
            </MainLayout>
        );
    }

    if (screen === 'ENGINEER_TASKS' && currentProject) {
        return (
            <MainLayout>
                <ProjectTasksList
                    projectId={currentProject.id!}
                    onBack={handleBackFromEngineerTasks}
                    canCreateTask={false} // Инженер только смотрит и меняет статус
                />
            </MainLayout>
        );
    }

    // === МЕНЕДЖЕР ===
    if (screen === 'MANAGER_PROJECTS') {
        return (
            <MainLayout>
                <ManagerPage
                    onSelectProject={handleManagerSelectProject}
                    onTaskCreated={handleManagerTaskCreated}
                />
            </MainLayout>
        );
    }

    if (screen === 'MANAGER_TASKS' && currentProject) {
        return (
            <MainLayout>
                <ProjectTasksList
                    projectId={currentProject.id!}
                    onBack={handleManagerBackToProjects}
                    onCreateTask={handleOpenTaskForm}
                />

                {/* 👇 Модалка формы задачи */}
                {showTaskModal && (
                    <TaskForm
                        projectId={currentProject.id!}
                        onCancel={() => setShowTaskModal(false)}
                        onSuccess={handleTaskCreated}
                    />
                )}
            </MainLayout>
        );
    }


    // Fallback для отладки
    return <div>Ошибка навигации: экран {screen}</div>;
}

export default App;