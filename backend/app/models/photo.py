from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime

class Photo(Document):
    """Фотография с геотегами"""

    # Файл
    filename: str
    file_path: str
    url: str
    file_size: int
    mime_type: str = "image/jpeg"

    # Принадлежость
    object_id: PydanticObjectId | None = None
    equipment_id: PydanticObjectId | None = None
    issue_id: PydanticObjectId | None = None

    # Геотег
    location: dict | None = None

    # EXIF
    timestamp_taken: datetime | None = None
    camera_model: str | None = None

    # Описание
    description: str | None = None
    tags: list[str] = []

    # Метаданные
    uploaded_by: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=datetime.now)

    # Синхронизация
    sync_version: int = 1
    is_synced: bool = True
    
    class Settings:
        name = "photos"
        indexes = [
            "object_id",
            "equipment_id",
            "issue_id",
            [("location", "2dsphere")],
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "filename": "IMG_20260309_123456.jpg",
                "file_path": "uploads/photos/IMG_20260309_123456.jpg",
                "url": "/uploads/photos/IMG_20260309_123456.jpg",
                "file_size": 2048576,
                "location": {
                    "type": "Point",
                    "coordinates": [37.6173, 55.7558]
                },
                "description": "Фото трансформатора"
            }
        }