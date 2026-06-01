from beanie import PydanticObjectId
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from datetime import datetime

async def create_task(task_data: TaskCreate, user_id: str) -> Task:
    task = Task(
        **task_data.model_dump(),
        created_by=user_id
    )
    await task.insert()
    return task

async def get_tasks(project_id: str | None = None, skip: int = 0, limit: int = 100) -> list[Task]:
    query = {}
    if project_id:
        query["project_id"] = PydanticObjectId(project_id)
    return await Task.find(query).skip(skip).limit(limit).to_list()

async def get_task(task_id: str) -> Task | None:
    return await Task.get(task_id)

async def update_task(task_id: str, task_data: TaskUpdate) -> Task | None:
    task = await Task.get(task_id)
    if not task:
        return None
        
    update_data = task_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    task.updated_at = datetime.now()
    task.sync_version += 1
    await task.save()
    return task

async def delete_task(task_id: str) -> bool:
    task = await Task.get(task_id)
    if not task:
        return False
    await task.delete()
    return True
