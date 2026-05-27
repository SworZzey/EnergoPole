from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from app.schemas import EquipmentCreate, EquipmentUpdate, EquipmentResponse
from app.crud import (
    create_equipment, get_equipment_list, get_equipment,
    update_equipment, delete_equipment
)
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/equipment", tags=["Оборудование"])


@router.post("/", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment_item(
    eq_data: EquipmentCreate,
    current_user: User = Depends(get_current_user)
):
    """Создать оборудование"""
    equipment = await create_equipment(eq_data, user_id=str(current_user.id))
    return equipment


@router.get("/", response_model=List[EquipmentResponse])
async def list_equipment(
    object_id: str | None = Query(None, description="ID объекта"),
    equipment_type: str | None = Query(None, description="Тип оборудования"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Получить список оборудования"""
    equipment = await get_equipment_list(
        object_id=object_id,
        equipment_type=equipment_type,
        skip=skip,
        limit=limit
    )
    return equipment


@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment_item(
    equipment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Получить оборудование по ID"""
    equipment = await get_equipment(equipment_id)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Оборудование с ID {equipment_id} не найдено"
        )
    return equipment


@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment_item(
    equipment_id: str,
    eq_data: EquipmentUpdate,
    current_user: User = Depends(get_current_user)
):
    """Обновить оборудование"""
    equipment = await update_equipment(equipment_id, eq_data)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Оборудование с ID {equipment_id} не найдено"
        )
    return equipment


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment_item(
    equipment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Удалить оборудование"""
    deleted = await delete_equipment(equipment_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Оборудование с ID {equipment_id} не найдено"
        )