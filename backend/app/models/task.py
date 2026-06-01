from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime

class Task(Document):
    """Задача (Task)"""
    
    project_id: PydanticObjectId
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    
    status: str = Field(default="open") # open, in_progress, closed
    
    # Геотег
    location: dict | None = None
    
    # Метаданные
    created_by: str | None = None # e.g. "manager"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = None
    
    # Синхронизация
    sync_version: int = 1
    is_synced: bool = True
    
    class Settings:
        name = "tasks"
        indexes = [
            "project_id",
            [("location", "2dsphere")],
        ]
