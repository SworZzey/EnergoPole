from pydantic import BaseModel, Field, ConfigDict, field_serializer
from beanie import PydanticObjectId
from datetime import datetime

class ProjectBase(BaseModel):
    """Базовые поля проекта"""
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None

class ProjectCreate(ProjectBase):
    """Создание проекта"""
    pass

class ProjectUpdate(BaseModel):
    """Обновление проекта"""
    name: str | None = Field(None, min_length=2, max_length=200)
    description: str | None = None

class ProjectResponse(ProjectBase):
    """Ответ с проектом"""
    id: PydanticObjectId
    created_by: PydanticObjectId | None = None
    created_at: datetime
    updated_at: datetime | None = None
    sync_version: int
    is_synced: bool
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id', 'created_by')
    def serialize_object_id(self, value: PydanticObjectId | None) -> str | None:
        return str(value) if value else None
