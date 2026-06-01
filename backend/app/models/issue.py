from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import List
from enum import Enum


class IssueSeverity(str, Enum):
    """Критичность замечания"""
    LOW = "low"           # Низкая
    MEDIUM = "medium"     # Средняя
    HIGH = "high"         # Высокая
    CRITICAL = "critical" # Критическая

class IssueStatus(str, Enum):
    """Статус замечания"""
    OPEN = "open"               # Открыто
    IN_PROGRESS = "in_progress" # В работе
    RESOLVED = "resolved"       # Решено
    CLOSED = "closed"           # Закрыто
    REJECTED = "rejected"       # Отклонено

class Issue(Document):
    """Замечание на объекте"""

    # Основная информация
    title: str = Field(min_length=2, max_length=200)
    description: str

    # Критичность и статус
    severity: IssueSeverity
    status: IssueStatus = IssueStatus.OPEN

    # Придлежность
    object_id: PydanticObjectId | None  # Ссылка на объект
    equipment_id: PydanticObjectId | None = None

    # Геолокация
    location: dict | None = None

    # Фотографии
    photo_ids: List[PydanticObjectId] = []

    # Назначение и выполнение
    assigned_to: PydanticObjectId | None = None
    due_date: datetime | None = None
    resolved_date: datetime | None = None
    resolution_notes: str | None = None

    # Метаданные
    created_by: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = None

    # Синхронизация
    sync_version: int = 1
    is_synced: bool = True
    
    class Settings:
        name = "issues"
        indexes = [
            "object_id",
            "equipment_id",
            "status",
            "severity",
            "assigned_to",
            [("location", "2dsphere")],
        ]

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Коррозия на корпусе трансформатора",
                "description": "Обнаружена коррозия в нижней части корпуса",
                "severity": "medium",
                "status": "open",
                "location": {
                    "type": "Point",
                    "coordinates": [37.6173, 55.7558]
                }
            }
        }