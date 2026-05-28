import React from 'react';
import SchemaCanvas from '../components/SchemaCanvas/SchemaCanvas';
import OnlineStatus from '../components/OnlineStatus';
import type { Schema } from '../db/database';

interface SchemaEditorPageProps {
    schema: Schema;
    projectId: number;
    onBack: () => void;
}

const SchemaEditor: React.FC<SchemaEditorPageProps> = ({ schema, projectId, onBack }) => {
    return (
        <div className="page-container">
            <SchemaCanvas
                schemaId={schema.id!}
                projectId={projectId}
                imageBlob={schema.imageBlob}
                onBack={onBack}
            />
            <OnlineStatus />
        </div>
    );
};

export default SchemaEditor;