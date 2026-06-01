from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.crud.project import (
    create_project, get_projects, get_project, update_project, delete_project
)
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Проекты"])

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project_route(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    project = await create_project(project_data, user_id=str(current_user.id))
    return project

@router.get("/", response_model=List[ProjectResponse])
async def list_projects_route(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    projects = await get_projects(skip=skip, limit=limit)
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project_route(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    project = await get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Проект с ID {project_id} не найден"
        )
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project_route(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user)
):
    project = await update_project(project_id, project_data)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Проект с ID {project_id} не найден"
        )
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_route(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    deleted = await delete_project(project_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Проект с ID {project_id} не найден"
        )
