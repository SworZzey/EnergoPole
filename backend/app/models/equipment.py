from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Dict, Any
from enum import Enum


class EquipmentType(str, Enum):
    """Типы оборудования"""
    TRANSFORMER = "transformer"       # Трансформатор
    BREAKER = "breaker"               # Выключатель
    SWITCH = "switch"                 # Разъединитель
    CABLE = "cable"                   # Кабель
    BUSBAR = "busbar"                 # Шина
    RELAY = "relay"                   # Реле
    OTHER = "other"                   # Другое

class EquipmentCondition(str, Enum):
    """Состояние оборудования"""
    GOOD = "good"                     # Хорошее
    SATISFACTORY = "satisfactory"     # Удовлетворительное
    POOR = "poor"                     # Плохое
    CRITICAL = "critical"             # Критическое

class Equipment(Document):
    """Оборудование на объекте"""

    # Информация об объекте
    name: str = Field(min_length=2, max_length=200)
    equipment_type: EquipmentType
    manufacturer: str | None = None
    model: str | None = None
    serial_number: str | None = None


    object_id: PydanticObjectId | None  # Ссылка на объект исследования

    # Геолокация
    location: dict | None = None

    # Спеки
    voltage: float | None = None
    power: float | None = None
    year_installed: int | None = None

    # Состояние
    condition: EquipmentCondition | None = None
    notes: str | None = None

    parameters: Dict[str, Any] | None = None # дополнительные параметры


    created_by: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = None

    # Синхронизация
    sync_version: int = 1
    is_synced: bool = True
    
    class Settings:
        name = "equipment"
        indexes = [
            "object_id",
            "equipment_type",
            "condition",
            [("location", "2dsphere")],
        ]

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Трансформатор Т1",
                "equipment_type": "transformer",
                "manufacturer": "РиМ",
                "model": "3WN6",
                "serial_number": "SN123456",
                "voltage": 110.0,
                "power": 63000.0,
                "year_installed": 2015,
                "condition": "good",
                "location": {
                    "type": "Point",
                    "coordinates": [37.6173, 55.7558]
                },
                "notes": "Проверен, состояние хорошее"
            }
        }