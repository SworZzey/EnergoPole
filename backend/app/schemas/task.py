from pydantic import BaseModel, Field, ConfigDict, field_serializer
from beanie import PydanticObjectId
from datetime import datetime

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

class TaskBase(BaseModel):
    project_id: PydanticObjectId
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    status: str = Field(default="open")
    location: GeoLocation | None = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=2, max_length=200)
    description: str | None = None
    status: str | None = None
    location: GeoLocation | None = None

class TaskResponse(TaskBase):
    id: PydanticObjectId
    created_by: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    sync_version: int
    is_synced: bool
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id', 'project_id')
    def serialize_object_id(self, value: PydanticObjectId | None) -> str | None:
        return str(value) if value else None
