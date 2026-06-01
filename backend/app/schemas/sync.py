from pydantic import BaseModel
from typing import List
from app.schemas.project import ProjectCreate
from app.schemas.note import NoteCreate
from app.schemas.task import TaskCreate

class BatchSyncRequest(BaseModel):
    """Запрос на массовую синхронизацию"""
    projects: List[ProjectCreate] = []
    notes: List[NoteCreate] = []
    tasks: List[TaskCreate] = []


class SyncResult(BaseModel):
    """Результат синхронизации одной сущности"""
    local_id: str | None = None  # ID из фронтенда (если был)
    server_id: str  # ID созданный на сервере
    type: str  # "project", "note", "task"
    status: str = "created"  # "created", "updated", "conflict"


class BatchSyncResponse(BaseModel):
    """Ответ на batch синхронизацию"""
    results: List[SyncResult]
    total_synced: int
    conflicts: List[dict] = []


class ConflictResolution(BaseModel):
    """Разрешение конфликта"""
    entity_id: str
    entity_type: str  # "project", "note", "task"
    resolution: str  # "use_server", "use_local", "merge"
    data: dict | None = None  # Данные для merge