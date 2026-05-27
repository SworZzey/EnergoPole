from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from app.schemas import IssueCreate, IssueUpdate, IssueResponse
from app.crud import (
    create_issue, get_issues, get_issue, update_issue, delete_issue,
    add_photo_to_issue
)
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/issues", tags=["Замечания"])


@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_inspection_issue(
    issue_data: IssueCreate,
    current_user: User = Depends(get_current_user)
):
    """Создать замечание"""
    issue = await create_issue(issue_data, user_id=str(current_user.id))
    return issue


@router.get("/", response_model=List[IssueResponse])
async def list_issues(
    object_id: str | None = Query(None, description="ID объекта"),
    status: str | None = Query(None, description="Статус"),
    severity: str | None = Query(None, description="Критичность"),
    assigned_to: str | None = Query(None, description="ID назначенного"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Получить список замечаний"""
    issues = await get_issues(
        object_id=object_id,
        status=status,
        severity=severity,
        assigned_to=assigned_to,
        skip=skip,
        limit=limit
    )
    return issues


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_inspection_issue(
    issue_id: str,
    current_user: User = Depends(get_current_user)
):
    """Получить замечание по ID"""
    issue = await get_issue(issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Замечание с ID {issue_id} не найдено"
        )
    return issue


@router.put("/{issue_id}", response_model=IssueResponse)
async def update_inspection_issue(
    issue_id: str,
    issue_data: IssueUpdate,
    current_user: User = Depends(get_current_user)
):
    """Обновить замечание"""
    issue = await update_issue(issue_id, issue_data)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Замечание с ID {issue_id} не найдено"
        )
    return issue


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inspection_issue(
    issue_id: str,
    current_user: User = Depends(get_current_user)
):
    """Удалить замечание"""
    deleted = await delete_issue(issue_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Замечание с ID {issue_id} не найдено"
        )


@router.post("/{issue_id}/photos/{photo_id}", response_model=IssueResponse)
async def attach_photo_to_issue(
    issue_id: str,
    photo_id: str,
    current_user: User = Depends(get_current_user)
):
    """Прикрепить фото к замечанию"""
    issue = await add_photo_to_issue(issue_id, photo_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Замечание с ID {issue_id} не найдено"
        )
    return issue