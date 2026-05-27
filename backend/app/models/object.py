from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import List
from enum import Enum


class ObjectStatus(str, Enum):
    """Статус обследования объекта"""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class InspectionObject(Document):
    """Объект электроснабжения для обследования"""

    # Информация об объекте
    name: str = Field(min_length=2, max_length=200)
    code: str | None = None
    address: str
    description: str | None = None

    # Геолокация
    location: dict | None = None # GeoJSON Point

    # Статус и владелец
    status: ObjectStatus = ObjectStatus.PLANNED
    assigned_to: PydanticObjectId | None = None

    # Даты
    planned_date: datetime | None = None
    inspection_date: datetime | None = None
    completed_date: datetime | None = None

    # Метаданные
    created_by: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = None

    # Синхронизация
    sync_version: int = 1
    is_synced: bool = True
    
    class Settings:
        name = "objects"
        indexes = [
            "status",
            "assigned_to",
            "code",
            [("location", "2dsphere")],  # Геопространственный индекс
        ]

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Подстанция ТП-3208",
                "code": "PS3208-001",
                "address": "г. Новосибирск, пл. Карла Маркса, д. 7",
                "description": "Трансформаторная подстанция 110 кВ",
                "location": {
                    "type": "Point",
                    "coordinates": [37.6173, 55.7558]
                },
                "status": "planned"
            }
        }