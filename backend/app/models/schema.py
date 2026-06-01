from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import List

class Schema(Document):
    """Схема объекта (изображение для офлайн-доступа)"""
    
    # Файл
    filename: str
    file_path: str
    url: str
    file_size: int
    mime_type: str = "image/png"
    
    # Принадлежность
    project_id: PydanticObjectId | None
    
    # Информация
    title: str
    description: str | None = None
    version: int = 1
    
    original_file_path: str | None = None 
    original_url: str | None = None
    annotated_file_path: str | None = None 
    annotated_url: str | None = None
    
    # Пометки на схеме (массив JSON объектов)
    annotations: List[dict] = []
    
    # Метаданные
    uploaded_by: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = None
    
    # Синхронизация
    sync_version: int = 1
    is_synced: bool = True
    
    class Settings:
        name = "schemas"
        indexes = [
            "project_id",
        ]