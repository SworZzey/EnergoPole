from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from app.schemas import ObjectCreate, ObjectUpdate, ObjectResponse
from app.crud import (
    create_object, get_objects, get_object, update_object, delete_object,
    get_nearby_objects
)
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/objects", tags=["Объекты"])


@router.post("/", response_model=ObjectResponse, status_code=status.HTTP_201_CREATED)
async def create_inspection_object(
    obj_data: ObjectCreate,
    current_user: User = Depends(get_current_user)
):
    """Создать объект обследования"""
    obj = await create_object(obj_data, user_id=str(current_user.id))
    return obj


@router.get("/", response_model=List[ObjectResponse])
async def list_objects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: str | None = None,
    assigned_to: str | None = None,
    current_user: User = Depends(get_current_user)
):
    """Получить список объектов"""
    objects = await get_objects(skip=skip, limit=limit, status=status, assigned_to=assigned_to)
    return objects


@router.get("/nearby", response_model=List[ObjectResponse])
async def get_nearby(
    longitude: float = Query(..., description="Долгота"),
    latitude: float = Query(..., description="Широта"),
    max_distance: int = Query(5000, ge=100, le=50000, description="Максимальное расстояние в метрах"),
    current_user: User = Depends(get_current_user)
):
    """Найти объекты рядом с координатами"""
    objects = await get_nearby_objects(longitude, latitude, max_distance)
    return objects


@router.get("/{object_id}", response_model=ObjectResponse)
async def get_inspection_object(
    object_id: str,
    current_user: User = Depends(get_current_user)
):
    """Получить объект по ID"""
    obj = await get_object(object_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Объект с ID {object_id} не найден"
        )
    return obj


@router.put("/{object_id}", response_model=ObjectResponse)
async def update_inspection_object(
    object_id: str,
    obj_data: ObjectUpdate,
    current_user: User = Depends(get_current_user)
):
    """Обновить объект"""
    obj = await update_object(object_id, obj_data)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Объект с ID {object_id} не найден"
        )
    return obj


@router.delete("/{object_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inspection_object(
    object_id: str,
    current_user: User = Depends(get_current_user)
):
    """Удалить объект"""
    deleted = await delete_object(object_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Объект с ID {object_id} не найден"
        )