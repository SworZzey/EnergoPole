from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.crud.task import (
    create_task, get_tasks, get_task, update_task, delete_task
)
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/tasks", tags=["Задачи"])

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task_route(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user)
):
    task = await create_task(task_data, user_id=str(current_user.id))
    return task

@router.get("/", response_model=List[TaskResponse])
async def list_tasks_route(
    project_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    tasks = await get_tasks(project_id=project_id, skip=skip, limit=limit)
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task_route(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    task = await get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Задача с ID {task_id} не найдена"
        )
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task_route(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user)
):
    task = await update_task(task_id, task_data)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Задача с ID {task_id} не найдена"
        )
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_route(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    deleted = await delete_task(task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Задача с ID {task_id} не найдена"
        )
