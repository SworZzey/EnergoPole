from pydantic import BaseModel, Field, ConfigDict, field_serializer
from beanie import PydanticObjectId
from datetime import datetime
from typing import Dict, Any
from app.models.equipment import EquipmentType, EquipmentCondition
from app.schemas.object import GeoLocation


class EquipmentBase(BaseModel):
    """Базовые поля оборудования"""
    name: str = Field(min_length=2, max_length=200)
    equipment_type: EquipmentType
    manufacturer: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    serial_number: str | None = Field(None, max_length=100)
    voltage: float | None = Field(None, ge=0)
    power: float | None = Field(None, ge=0)
    year_installed: int | None = Field(None, ge=1900, le=2100)
    condition: EquipmentCondition | None = None
    notes: str | None = None
    location: GeoLocation | None = None


class EquipmentCreate(EquipmentBase):
    """Создание оборудования"""
    object_id: str  # ID объекта
    parameters: Dict[str, Any] | None = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Трансформатор Т1",
                "equipment_type": "transformer",
                "manufacturer": "РиМ",
                "model": "3WN6",
                "serial_number": "SN123456",
                "object_id": "507f1f77bcf86cd799439011",
                "voltage": 110.0,
                "power": 63000.0,
                "year_installed": 2015,
                "condition": "good",
                "location": {
                    "type": "Point",
                    "coordinates": [37.6173, 55.7558]
                }
            }
        }
    )


class EquipmentUpdate(BaseModel):
    """Обновление оборудования"""
    name: str = Field(min_length=2, max_length=200)
    equipment_type: EquipmentType | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial_number: str | None = None
    voltage: float | None = None
    power: float | None = None
    year_installed: int | None = None
    condition: EquipmentCondition | None = None
    notes: str | None = None
    location: GeoLocation | None = None
    parameters: Dict[str, Any] | None = None


class EquipmentResponse(EquipmentBase):
    """Ответ с оборудованием"""
    id: PydanticObjectId
    object_id: PydanticObjectId
    parameters: Dict[str, Any] | None = None
    created_by: PydanticObjectId | None = None
    created_at: datetime
    updated_at: datetime | None = None
    sync_version: int
    is_synced: bool
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id', 'object_id', 'created_by')
    def serialize_object_id(self, value: PydanticObjectId | None) -> str | None:
        return str(value) if value else None