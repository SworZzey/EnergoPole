from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime

class Project(Document):
    """Проект (Объект обследования)"""
    
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    
    # Метаданные
    created_by: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = None
    
    # Синхронизация
    sync_version: int = 1
    is_synced: bool = True
    
    class Settings:
        name = "projects"
        indexes = [
            "name",
        ]
