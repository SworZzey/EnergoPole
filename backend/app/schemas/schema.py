from pydantic import BaseModel, Field, ConfigDict, field_serializer
from beanie import PydanticObjectId
from datetime import datetime
from typing import Optional

# ========== ANNOTATION (для пометок) ==========
class AnnotationCreate(BaseModel):
    """Пометка на схеме"""
    type: str = Field(..., pattern="^(arrow|circle|text|marker|rectangle)$")
    x: float
    y: float
    x2: float | None = None  # Для arrow, rectangle
    y2: float | None = None
    radius: float | None = None  # Для circle
    text: str | None = None  # Для text
    color: str = "#FF0000"
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "arrow",
                "x": 100,
                "y": 200,
                "x2": 300,
                "y2": 400,
                "color": "#FF0000"
            }
        }
    )

# ========== RESPONSE ==========
class SchemaResponse(BaseModel):
    """Ответ со схемой"""
    id: PydanticObjectId
    filename: str
    url: str
    file_size: int
    mime_type: str
    project_id: PydanticObjectId
    title: str
    description: str | None = None
    version: int
    
    original_file_path: str | None = None
    original_url: str | None = None
    annotated_file_path: str | None = None
    annotated_url: str | None = None
    annotations: list[dict] = []  # JSON пометок
    
    uploaded_by: PydanticObjectId | None = None
    created_at: datetime
    updated_at: datetime | None = None
    sync_version: int
    is_synced: bool
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id', 'project_id', 'uploaded_by')
    def serialize_object_id(self, value: PydanticObjectId) -> str | None:
        return str(value) if value else None