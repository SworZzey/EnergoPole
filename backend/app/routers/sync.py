from fastapi import APIRouter, Depends, Query
from typing import List
from datetime import datetime
from app.schemas.sync import (
    BatchSyncRequest, BatchSyncResponse, SyncResult
)
from app.crud.sync import (
    batch_create_objects, batch_create_equipment, batch_create_issues,
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
    """
    Массовая синхронизация данных
    Есть офлайн изменения для синхронизации
    """
    results = []
    user_id = str(current_user.id)
    
    if sync_data.objects:
        created_objects = await batch_create_objects(sync_data.objects, user_id)
        for local_id, obj in created_objects:
            results.append(SyncResult(
                local_id=local_id,
                server_id=str(obj.id),
                type="object",
                status="created"
            ))
    
    if sync_data.equipment:
        created_equipment = await batch_create_equipment(sync_data.equipment, user_id)
        for local_id, eq in created_equipment:
            results.append(SyncResult(
                local_id=local_id,
                server_id=str(eq.id),
                type="equipment",
                status="created"
            ))
    
    if sync_data.issues:
        created_issues = await batch_create_issues(sync_data.issues, user_id)
        for local_id, issue in created_issues:
            results.append(SyncResult(
                local_id=local_id,
                server_id=str(issue.id),
                type="issue",
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
    entity_types: List[str] = Query(["objects", "equipment", "issues"]),
    current_user: User = Depends(get_current_user)
):
    """
    Получить изменения с сервера
    
    Pull-синхронизация:
    клиент запрашивает что изменилось на сервере с момента last_sync
    """
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
    """Статус синхронизации пользователя"""
    
    from app.models.object import InspectionObject
    from app.models.equipment import Equipment
    from app.models.issue import Issue
    from beanie import PydanticObjectId
    
    user_oid = PydanticObjectId(str(current_user.id))
    
    unsynced_objects = await InspectionObject.find(
        InspectionObject.created_by == user_oid,
        InspectionObject.is_synced == False
    ).count()
    
    unsynced_equipment = await Equipment.find(
        Equipment.created_by == user_oid,
        Equipment.is_synced == False
    ).count()
    
    unsynced_issues = await Issue.find(
        Issue.created_by == user_oid,
        Issue.is_synced == False
    ).count()
    
    return {
        "user_id": str(current_user.id),
        "unsynced": {
            "objects": unsynced_objects,
            "equipment": unsynced_equipment,
            "issues": unsynced_issues,
            "total": unsynced_objects + unsynced_equipment + unsynced_issues
        },
        "last_check": datetime.now()
    }