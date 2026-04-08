// src/App.tsx
import React, { useState } from 'react';
import ProjectList from './components/ProjectList/ProjectList.tsx';
import SchemaCanvas from './components/SchemaCanvas/SchemaCanvas.tsx';
import OnlineStatus from './components/OnlineStatus';
import { dbService } from './services/dbService';
import type { Schema } from './db/database';

function App() {
    const [currentSchema, setCurrentSchema] = useState<Schema | null>(null);
    const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

    const handleSelectProject = async (projectId: number, schemaId: number) => {
        const schema = await dbService.getSchemaById(schemaId); // нужно добавить этот метод в dbService
        if (schema) {
            setCurrentSchema(schema);
            setCurrentProjectId(projectId);
        }
    };

    const handleBack = () => {
        setCurrentSchema(null);
        setCurrentProjectId(null);
    };

    if (currentSchema && currentProjectId) {
        return (
            <div>
                <button onClick={handleBack}>← Назад к проектам</button>
                <SchemaCanvas
                    schemaId={currentSchema.id!}
                    projectId={currentProjectId}
                    imageBlob={currentSchema.imageBlob}
                />
                <OnlineStatus />
            </div>
        );
    }

    return (
        <div>
            <OnlineStatus />
            <ProjectList onSelectProject={handleSelectProject} />
        </div>
    );
}

export default App;