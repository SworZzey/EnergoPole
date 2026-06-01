from pydantic import BaseModel, Field, ConfigDict, field_serializer
from beanie import PydanticObjectId
from datetime import datetime
from typing import Optional
from app.schemas.task import GeoLocation


class PhotoResponse(BaseModel):
    """Ответ с фото (Upload будет через multipart/form-data)"""
    id: PydanticObjectId
    filename: str
    url: str
    file_size: int
    mime_type: str
    project_id: PydanticObjectId | None = None
    note_id: PydanticObjectId | None = None
    location: GeoLocation | None = None
    timestamp_taken: datetime | None = None
    camera_model: str | None = None
    description: str | None = None
    tags: list[str] = []
    uploaded_by: PydanticObjectId | None = None
    created_at: datetime
    sync_version: int
    is_synced: bool
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id', 'project_id', 'note_id', 'uploaded_by')
    def serialize_object_id(self, value: PydanticObjectId) -> str | None:
        return str(value) if value else None