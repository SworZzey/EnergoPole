from pydantic import BaseModel, Field, ConfigDict, field_serializer
from beanie import PydanticObjectId
from datetime import datetime
from app.models.object import ObjectStatus


class GeoLocation(BaseModel):
    """GeoJSON Point"""
    type: str = "Point"
    coordinates: list[float] = Field(min_length=2, max_length=2)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "Point",
                "coordinates": [37.6173, 55.7558]
            }
        }
    )


class ObjectBase(BaseModel):
    """Базовые поля объекта"""
    name: str = Field(min_length=2, max_length=200)
    code: str | None = Field(None, max_length=50)
    address: str = Field(min_length=5, max_length=500)
    description: str | None = None
    location: GeoLocation | None = None


class ObjectCreate(ObjectBase):
    """Создание объекта"""
    status: ObjectStatus | None = ObjectStatus.PLANNED
    assigned_to: str | None = None  # ID инспектора
    planned_date: datetime | None = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Подстанция ТП-3208",
                "code": "PS3208-001",
                "address": "г. Новосибирск, пл. Карла Маркса, д. 7",
                "description": "Трансформаторная подстанция 110 кВ",
                "location": {
                    "type": "Point",
                    "coordinates": [37.6173, 55.7558]
                },
                "status": "planned",
                "planned_date": "2026-03-15T10:00:00"
            }
        }
    )


class ObjectUpdate(BaseModel):
    """Обновление объекта"""
    name: str | None = Field(min_length=2, max_length=200)
    code: str | None = Field(max_length=50)
    address: str | None = Field(min_length=5, max_length=500)
    description: str | None = None
    location: GeoLocation | None = None
    status: ObjectStatus | None = None
    assigned_to: str | None = None
    inspection_date: datetime | None = None
    completed_date: datetime | None = None


class ObjectResponse(ObjectBase):
    """Ответ с объектом"""
    id: PydanticObjectId
    status: ObjectStatus
    assigned_to: PydanticObjectId | None = None
    planned_date: datetime | None = None
    inspection_date: datetime | None = None
    completed_date: datetime | None = None
    created_by: PydanticObjectId | None = None
    created_at: datetime
    updated_at: datetime | None = None
    sync_version: int
    is_synced: bool
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id', 'assigned_to', 'created_by')
    def serialize_object_id(self, value: PydanticObjectId | None) -> str | None:
        return str(value) if value else None