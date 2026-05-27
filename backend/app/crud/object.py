from app.models.object import InspectionObject
from app.schemas.object import ObjectCreate, ObjectUpdate
from typing import List
from beanie import PydanticObjectId
from datetime import datetime


async def create_object(
    obj_data: ObjectCreate,
    user_id: str | None = None
) -> InspectionObject:
    """Создание объекта исследования"""

    data_dict = obj_data.model_dump()
    if data_dict.get("assigned_to"):
        data_dict["assigned_to"] = PydanticObjectId(data_dict["assigned_to"])

    obj = InspectionObject(**data_dict)
    
    if user_id:
        obj.created_by = PydanticObjectId(user_id)
    
    await obj.insert()
    return obj


async def get_objects( 
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    assigned_to: str | None = None,
) -> List[InspectionObject]:
    """Получение списка объектов с фильтрацией"""
    
    query = {}
    
    if status:
        query["status"] = status
    
    if assigned_to:
        query["assigned_to"] = PydanticObjectId(assigned_to)
    
    objects = await InspectionObject.find(query).skip(skip).limit(limit).to_list()
    return objects


async def get_object(object_id: str) -> InspectionObject | None:
    """Получение объекта по ID"""
    return await InspectionObject.get(object_id)



async def update_object(
    object_id: str,
    obj_data: ObjectUpdate
) -> InspectionObject | None:
    """Обновить объект"""
    
    obj = await InspectionObject.get(object_id)
    if not obj:
        return None
    
    # Обновляем только переданные поля
    update_data = obj_data.model_dump(exclude_unset=True)
    
    # Преобразуем assigned_to в ObjectId
    if "assigned_to" in update_data and update_data["assigned_to"]:
        update_data["assigned_to"] = PydanticObjectId(update_data["assigned_to"])
    

    for field, value in update_data.items():
        setattr(obj, field, value)
    
    obj.updated_at = datetime.now()
    obj.sync_version += 1
    
    await obj.save()
    return obj



async def delete_object(object_id: str) -> bool:
    """Удалить объект"""
    obj = await InspectionObject.get(object_id)
    if not obj:
        return False
    
    await obj.delete()
    return True



async def get_nearby_objects(
    longitude: float,
    latitude: float,
    max_distance: int = 5000  
) -> List[InspectionObject]:
    """Найти объекты рядом с координатами"""
    
    # MongoDB геопространственный запрос
    objects = await InspectionObject.find(
        {
            "location": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [longitude, latitude]
                    },
                    "$maxDistance": max_distance
                }
            }
        }
    ).to_list()
    
    return objects