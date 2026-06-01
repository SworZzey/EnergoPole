from pydantic import BaseModel, Field, ConfigDict, field_serializer
from beanie import PydanticObjectId
from datetime import datetime
from app.models.issue import IssueSeverity, IssueStatus
from app.schemas.object import GeoLocation


class IssueBase(BaseModel):
    """Базовые поля замечания"""
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=5)
    severity: IssueSeverity
    location: GeoLocation | None = None


class IssueCreate(IssueBase):
    """Создание замечания"""
    object_id: str  # ID объекта
    equipment_id: str | None = None  # ID оборудования
    assigned_to: str | None = None
    due_date: datetime | None = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Коррозия на корпусе",
                "description": "Обнаружена коррозия в нижней части корпуса трансформатора",
                "severity": "medium",
                "object_id": "507f1f77bcf86cd799439011",
                "location": {
                    "type": "Point",
                    "coordinates": [37.6173, 55.7558]
                }
            }
        }
    )


class IssueUpdate(BaseModel):
    """Обновление замечания"""
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=5)
    severity: IssueSeverity | None = None
    status: IssueStatus | None = None
    assigned_to: str | None = None
    due_date: datetime | None = None
    resolution_notes: str | None = None
    location: GeoLocation | None = None

# ========== RESPONSE ==========
class IssueResponse(IssueBase):
    """Ответ с замечанием"""
    id: PydanticObjectId
    object_id: PydanticObjectId
    equipment_id: PydanticObjectId | None = None
    status: IssueStatus
    photo_ids: list[PydanticObjectId] = []
    assigned_to: PydanticObjectId | None = None
    due_date: datetime | None = None
    resolved_date: datetime | None = None
    resolution_notes: str | None = None
    created_by: PydanticObjectId | None = None
    created_at: datetime
    updated_at: datetime | None = None
    sync_version: int
    is_synced: bool
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id', 'object_id', 'equipment_id', 'assigned_to', 'created_by')
    def serialize_object_id(self, value: PydanticObjectId | None) -> str | None:
        return str(value) if value else None
    
    @field_serializer('photo_ids')
    def serialize_photo_ids(self, value: list[PydanticObjectId]) -> list[str]:
        return [str(id) for id in value]