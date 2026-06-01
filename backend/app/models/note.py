from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime

class Note(Document):
    """Замечание (Note)"""
    
    project_id: PydanticObjectId
    schema_id: PydanticObjectId | None = None
    
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    priority: str = Field(default="medium") # high, medium, low
    status: str = Field(default="open") # open, in_progress, closed
    
    annotation_ids: list[str] = []
    photo_ids: list[str] = []
    
    # Метаданные
    created_by: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = None
    
    # Синхронизация
    sync_version: int = 1
    is_synced: bool = True
    
    class Settings:
        name = "notes"
        indexes = [
            "project_id",
            "schema_id",
        ]
