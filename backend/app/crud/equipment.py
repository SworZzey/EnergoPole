from app.models.equipment import Equipment
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate
from typing import List
from beanie import PydanticObjectId
from datetime import datetime

async def create_equipment(
    eq_data: EquipmentCreate,
    user_id: str | None = None
) -> Equipment:
    """Создать оборудование"""
    
    data_dict = eq_data.model_dump()
    data_dict["object_id"] = PydanticObjectId(data_dict["object_id"])
    
    equipment = Equipment(**data_dict)
    
    if user_id:
        equipment.created_by = PydanticObjectId(user_id)
    
    await equipment.insert()
    return equipment


async def get_equipment_list(
    object_id: str | None = None,
    equipment_type: str | None = None,
    skip: int = 0,
    limit: int = 100
) -> List[Equipment]:
    """Получить список оборудования"""
    
    query = {}
    
    if object_id:
        query["object_id"] = PydanticObjectId(object_id)
    
    if equipment_type:
        query["equipment_type"] = equipment_type
    
    equipment = await Equipment.find(query).skip(skip).limit(limit).to_list()
    return equipment


async def get_equipment(equipment_id: str) -> Equipment | None:
    """Получить оборудование по ID"""
    return await Equipment.get(equipment_id)


async def update_equipment(
    equipment_id: str,
    eq_data: EquipmentUpdate
) -> Equipment | None:
    """Обновить оборудование"""
    
    equipment = await Equipment.get(equipment_id)
    if not equipment:
        return None
    
    update_data = eq_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(equipment, field, value)
    
    equipment.updated_at = datetime.now()
    equipment.sync_version += 1
    
    await equipment.save()
    return equipment


async def delete_equipment(equipment_id: str) -> bool:
    """Удалить оборудование"""
    equipment = await Equipment.get(equipment_id)
    if not equipment:
        return False
    
    await equipment.delete()
    return True