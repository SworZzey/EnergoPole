from app.models.issue import Issue
from app.schemas.issue import IssueCreate, IssueUpdate
from typing import List
from beanie import PydanticObjectId
from datetime import datetime

async def create_issue(
    issue_data: IssueCreate,
    user_id: str | None = None
) -> Issue:
    """Создать замечание"""
    
    data_dict = issue_data.model_dump()
    data_dict["object_id"] = PydanticObjectId(data_dict["object_id"])
    
    if data_dict.get("equipment_id"):
        data_dict["equipment_id"] = PydanticObjectId(data_dict["equipment_id"])
    
    if data_dict.get("assigned_to"):
        data_dict["assigned_to"] = PydanticObjectId(data_dict["assigned_to"])
    
    issue = Issue(**data_dict)
    
    if user_id:
        issue.created_by = PydanticObjectId(user_id)
    
    await issue.insert()
    return issue


async def get_issues(
    object_id: str | None = None,
    status: str | None = None,
    severity: str | None = None,
    assigned_to: str | None = None,
    skip: int = 0,
    limit: int = 100
) -> List[Issue]:
    """Получить список замечаний с фильтрацией"""
    
    query = {}
    
    if object_id:
        query["object_id"] = PydanticObjectId(object_id)
    
    if status:
        query["status"] = status
    
    if severity:
        query["severity"] = severity
    
    if assigned_to:
        query["assigned_to"] = PydanticObjectId(assigned_to)
    
    issues = await Issue.find(query).skip(skip).limit(limit).to_list()
    return issues


async def get_issue(issue_id: str) -> Issue | None:
    """Получить замечание по ID"""
    return await Issue.get(issue_id)


async def update_issue(
    issue_id: str,
    issue_data: IssueUpdate
) -> Issue | None:
    """Обновить замечание"""
    
    issue = await Issue.get(issue_id)
    if not issue:
        return None
    
    update_data = issue_data.model_dump(exclude_unset=True)
    
    if "assigned_to" in update_data and update_data["assigned_to"]:
        update_data["assigned_to"] = PydanticObjectId(update_data["assigned_to"])
    
    for field, value in update_data.items():
        setattr(issue, field, value)
    
    issue.updated_at = datetime.now()
    issue.sync_version += 1
    
    await issue.save()
    return issue


async def delete_issue(issue_id: str) -> bool:
    """Удалить замечание"""
    issue = await Issue.get(issue_id)
    if not issue:
        return False
    
    await issue.delete()
    return True


async def add_photo_to_issue(issue_id: str, photo_id: str) -> Issue | None:
    """Добавить фото к замечанию"""
    issue = await Issue.get(issue_id)
    if not issue:
        return None
    
    photo_oid = PydanticObjectId(photo_id)
    if photo_oid not in issue.photo_ids:
        issue.photo_ids.append(photo_oid)
        await issue.save()
    
    return issue