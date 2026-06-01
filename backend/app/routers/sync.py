from fastapi import APIRouter, Depends, Query
from typing import List
from datetime import datetime
from app.schemas.sync import (
    BatchSyncRequest, BatchSyncResponse, SyncResult
)
from app.crud.sync import (
    batch_create_projects, batch_create_notes, batch_create_tasks,
    get_changes_since
)
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/sync", tags=["Синхронизация"])

@router.post("/batch", response_model=BatchSyncResponse)
async def batch_sync(
    sync_data: BatchSyncRequest,
    current_user: User = Depends(get_current_user)
):
    results = []
    user_id = str(current_user.id)
    
    if sync_data.projects:
        created_projects = await batch_create_projects(sync_data.projects, user_id)
        for local_id, proj in created_projects:
            results.append(SyncResult(
                local_id=local_id,
                server_id=str(proj.id),
                type="project",
                status="created"
            ))
    
    if sync_data.notes:
        created_notes = await batch_create_notes(sync_data.notes, user_id)
        for local_id, note in created_notes:
            results.append(SyncResult(
                local_id=local_id,
                server_id=str(note.id),
                type="note",
                status="created"
            ))
    
    if sync_data.tasks:
        created_tasks = await batch_create_tasks(sync_data.tasks, user_id)
        for local_id, task in created_tasks:
            results.append(SyncResult(
                local_id=local_id,
                server_id=str(task.id),
                type="task",
                status="created"
            ))
    
    return BatchSyncResponse(
        results=results,
        total_synced=len(results),
        conflicts=[]
    )

@router.get("/pull")
async def pull_changes(
    last_sync: datetime = Query(description="Время последней синхронизации"),
    entity_types: List[str] = Query(["projects", "notes", "tasks"]),
    current_user: User = Depends(get_current_user)
):
    changes = await get_changes_since(
        user_id=str(current_user.id),
        last_sync=last_sync,
        entity_types=entity_types
    )
    
    return {
        "last_sync": datetime.now(),
        "changes": changes
    }

@router.get("/status")
async def sync_status(
    current_user: User = Depends(get_current_user)
):
    from app.models.project import Project
    from app.models.note import Note
    from app.models.task import Task
    from beanie import PydanticObjectId
    
    user_oid = PydanticObjectId(str(current_user.id))
    
    unsynced_projects = await Project.find(
        Project.created_by == user_oid,
        Project.is_synced == False
    ).count()
    
    unsynced_notes = await Note.find(
        Note.created_by == user_oid,
        Note.is_synced == False
    ).count()
    
    unsynced_tasks = await Task.find(
        Task.created_by == str(current_user.id),
        Task.is_synced == False
    ).count()
    
    return {
        "user_id": str(current_user.id),
        "unsynced": {
            "projects": unsynced_projects,
            "notes": unsynced_notes,
            "tasks": unsynced_tasks,
            "total": unsynced_projects + unsynced_notes + unsynced_tasks
        },
        "last_check": datetime.now()
    }