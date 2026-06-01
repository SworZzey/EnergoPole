from typing import List, Tuple
from app.models.project import Project
from app.models.note import Note
from app.models.task import Task
from app.schemas.project import ProjectCreate
from app.schemas.note import NoteCreate
from app.schemas.task import TaskCreate
from beanie import PydanticObjectId
from datetime import datetime


async def batch_create_projects(
    projects_data: List[ProjectCreate],
    user_id: str
) -> List[Tuple[str, Project]]:
    results = []
    for proj_data in projects_data:
        local_id = getattr(proj_data, 'local_id', None)
        data_dict = proj_data.model_dump(exclude={'local_id'} if hasattr(proj_data, 'local_id') else set())
        
        proj = Project(**data_dict)
        proj.created_by = PydanticObjectId(user_id)
        
        await proj.insert()
        results.append((local_id, proj))
    return results


async def batch_create_notes(
    notes_data: List[NoteCreate],
    user_id: str
) -> List[Tuple[str, Note]]:
    results = []
    for note_data in notes_data:
        local_id = getattr(note_data, 'local_id', None)
        data_dict = note_data.model_dump(exclude={'local_id'} if hasattr(note_data, 'local_id') else set())
        
        data_dict["project_id"] = PydanticObjectId(data_dict["project_id"])
        if data_dict.get("schema_id"):
            data_dict["schema_id"] = PydanticObjectId(data_dict["schema_id"])
            
        note = Note(**data_dict)
        note.created_by = PydanticObjectId(user_id)
        
        await note.insert()
        results.append((local_id, note))
    return results


async def batch_create_tasks(
    tasks_data: List[TaskCreate],
    user_id: str
) -> List[Tuple[str, Task]]:
    results = []
    for task_data in tasks_data:
        local_id = getattr(task_data, 'local_id', None)
        data_dict = task_data.model_dump(exclude={'local_id'} if hasattr(task_data, 'local_id') else set())
        
        data_dict["project_id"] = PydanticObjectId(data_dict["project_id"])
        
        task = Task(**data_dict)
        task.created_by = user_id
        
        await task.insert()
        results.append((local_id, task))
    return results


async def check_sync_conflict(
    entity_id: str,
    client_sync_version: int,
    entity_type: str
) -> bool:
    if entity_type == "project":
        entity = await Project.get(entity_id)
    elif entity_type == "note":
        entity = await Note.get(entity_id)
    elif entity_type == "task":
        entity = await Task.get(entity_id)
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
    if entity_types is None:
        entity_types = ["projects", "notes", "tasks"]
    
    changes = {}
    
    if "projects" in entity_types:
        projects = await Project.find(
            {"$and": [
                {"updated_at": {"$ne": None}},
                {"updated_at": {"$gte": last_sync}}
            ]}
        ).to_list()
        changes["projects"] = projects
    
    if "notes" in entity_types:
        notes = await Note.find(
            {"$and": [
                {"updated_at": {"$ne": None}},
                {"updated_at": {"$gte": last_sync}}
            ]}
        ).to_list()
        changes["notes"] = notes
    
    if "tasks" in entity_types:
        tasks = await Task.find(
            {"$and": [
                {"updated_at": {"$ne": None}},
                {"updated_at": {"$gte": last_sync}}
            ]}
        ).to_list()
        changes["tasks"] = tasks
    
    return changes