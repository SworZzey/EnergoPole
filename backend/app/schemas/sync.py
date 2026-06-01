from pydantic import BaseModel
from typing import List
from app.schemas.object import ObjectCreate
from app.schemas.equipment import EquipmentCreate
from app.schemas.issue import IssueCreate

class BatchSyncRequest(BaseModel):
    """Запрос на массовую синхронизацию"""
    objects: List[ObjectCreate] = []
    equipment: List[EquipmentCreate] = []
    issues: List[IssueCreate] = []


class SyncResult(BaseModel):
    """Результат синхронизации одной сущности"""
    local_id: str | None = None  # ID из фронтенда (если был)
    server_id: str  # ID созданный на сервере
    type: str  # "object", "equipment", "issue"
    status: str = "created"  # "created", "updated", "conflict"


class BatchSyncResponse(BaseModel):
    """Ответ на batch синхронизацию"""
    results: List[SyncResult]
    total_synced: int
    conflicts: List[dict] = []


class ConflictResolution(BaseModel):
    """Разрешение конфликта"""
    entity_id: str
    entity_type: str  # "object", "equipment", "issue"
    resolution: str  # "use_server", "use_local", "merge"
    data: dict | None = None  # Данные для merge