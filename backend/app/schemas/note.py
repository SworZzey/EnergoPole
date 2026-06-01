from pydantic import BaseModel, Field, ConfigDict, field_serializer
from beanie import PydanticObjectId
from datetime import datetime

class NoteBase(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    priority: str = Field(default="medium")
    status: str = Field(default="open")
    project_id: PydanticObjectId
    schema_id: PydanticObjectId | None = None
    annotation_ids: list[str] = []
    photo_ids: list[str] = []

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: str | None = Field(None, min_length=2, max_length=200)
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    schema_id: PydanticObjectId | None = None
    annotation_ids: list[str] | None = None
    photo_ids: list[str] | None = None

class NoteResponse(NoteBase):
    id: PydanticObjectId
    created_by: PydanticObjectId | None = None
    created_at: datetime
    updated_at: datetime | None = None
    sync_version: int
    is_synced: bool
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id', 'project_id', 'schema_id', 'created_by')
    def serialize_object_id(self, value: PydanticObjectId | None) -> str | None:
        return str(value) if value else None
