from typing import List, Tuple
from app.models.object import InspectionObject
from app.models.equipment import Equipment
from app.models.issue import Issue
from app.schemas.object import ObjectCreate
from app.schemas.equipment import EquipmentCreate
from app.schemas.issue import IssueCreate
from beanie import PydanticObjectId
from datetime import datetime


async def batch_create_objects(
    objects_data: List[ObjectCreate],
    user_id: str
) -> List[Tuple[str, InspectionObject]]:
    """
    Массовое создание объектов
    
    Returns:
        List[(local_id, created_object)]
    """
    results = []
    
    for obj_data in objects_data:
        # local_id может быть передан фронтом для маппинга
        local_id = getattr(obj_data, 'local_id', None)
        
        data_dict = obj_data.model_dump(exclude={'local_id'} if hasattr(obj_data, 'local_id') else set())
        
        if data_dict.get("assigned_to"):
            data_dict["assigned_to"] = PydanticObjectId(data_dict["assigned_to"])
        
        obj = InspectionObject(**data_dict)
        obj.created_by = PydanticObjectId(user_id)
        
        await obj.insert()
        
        results.append((local_id, obj))
    
    return results


async def batch_create_equipment(
    equipment_data: List[EquipmentCreate],
    user_id: str
) -> List[Tuple[str, Equipment]]:
    """Массовое создание оборудования"""
    results = []
    
    for eq_data in equipment_data:
        local_id = getattr(eq_data, 'local_id', None)
        
        data_dict = eq_data.model_dump(exclude={'local_id'} if hasattr(eq_data, 'local_id') else set())
        data_dict["object_id"] = PydanticObjectId(data_dict["object_id"])
        
        equipment = Equipment(**data_dict)
        equipment.created_by = PydanticObjectId(user_id)
        
        await equipment.insert()
        
        results.append((local_id, equipment))
    
    return results


async def batch_create_issues(
    issues_data: List[IssueCreate],
    user_id: str
) -> List[Tuple[str, Issue]]:
    """Массовое создание замечаний"""
    results = []
    
    for issue_data in issues_data:
        local_id = getattr(issue_data, 'local_id', None)
        
        data_dict = issue_data.model_dump(exclude={'local_id'} if hasattr(issue_data, 'local_id') else set())
        data_dict["object_id"] = PydanticObjectId(data_dict["object_id"])
        
        if data_dict.get("equipment_id"):
            data_dict["equipment_id"] = PydanticObjectId(data_dict["equipment_id"])
        
        if data_dict.get("assigned_to"):
            data_dict["assigned_to"] = PydanticObjectId(data_dict["assigned_to"])
        
        issue = Issue(**data_dict)
        issue.created_by = PydanticObjectId(user_id)
        
        await issue.insert()
        
        results.append((local_id, issue))
    
    return results


async def check_sync_conflict(
    entity_id: str,
    client_sync_version: int,
    entity_type: str
) -> bool:
    """
    Проверить конфликт синхронизации
    
    Returns:
        True если есть конфликт
    """
    if entity_type == "object":
        entity = await InspectionObject.get(entity_id)
    elif entity_type == "equipment":
        entity = await Equipment.get(entity_id)
    elif entity_type == "issue":
        entity = await Issue.get(entity_id)
    else:
        return False
    
    if not entity:
        return False
    
    return entity.sync_version > client_sync_version


async def get_changes_since(
    user_id: str,
    last_sync: datetime,
    entity_types: List[str] | None = None
) -> dict:
    """
    Получить изменения с последней синхронизации
    
    Используется для pull-синхронизации
    (клиент запрашивает что изменилось на сервере)
    """
    if entity_types is None:
        entity_types = ["objects", "equipment", "issues"]
    
    changes = {}
    
    if "objects" in entity_types:
        objects = await InspectionObject.find(
            {"$and": [
                {"updated_at": {"$ne": None}},
                {"updated_at": {"$gte": last_sync}}
            ]}
        ).to_list()
        changes["objects"] = objects
    
    if "equipment" in entity_types:
        equipment = await Equipment.find(
            {"$and": [
                {"updated_at": {"$ne": None}},
                {"updated_at": {"$gte": last_sync}}
            ]}
        ).to_list()
        changes["equipment"] = equipment
    
    if "issues" in entity_types:
        issues = await Issue.find(
            {"$and": [
                {"updated_at": {"$ne": None}},
                {"updated_at": {"$gte": last_sync}}
            ]}
        ).to_list()
        changes["issues"] = issues
    
    return changes