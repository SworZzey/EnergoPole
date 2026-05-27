from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.schemas import PhotoResponse
from app.models.photo import Photo
from app.auth import get_current_user
from app.models.user import User
from app.utils import (
    save_upload_file, extract_exif_data, validate_image_file
)
from beanie import PydanticObjectId

router = APIRouter(prefix="/photos", tags=["Фотографии"])


@router.post("/", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    object_id: str | None = Form(None),
    equipment_id: str | None = Form(None),
    issue_id: str | None = Form(None),
    description: str | None = Form(None),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Загрузить фотографию"""
    
    # Валидация файла
    if not validate_image_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть изображением (JPEG, PNG, WebP)"
        )
    
    file_path, url, file_size = await save_upload_file(file, subfolder="photos")
    
    exif_data = extract_exif_data(file_path)
    
    # запись в БД
    photo = Photo(
        filename=file.filename or "unknown",
        file_path=file_path,
        url=url,
        file_size=file_size,
        mime_type=file.content_type or "image/jpeg",
        uploaded_by=PydanticObjectId(str(current_user.id)),
        description=description
    )
    
    # Привязка к объектам
    if object_id:
        photo.object_id = PydanticObjectId(object_id)
    if equipment_id:
        photo.equipment_id = PydanticObjectId(equipment_id)
    if issue_id:
        photo.issue_id = PydanticObjectId(issue_id)
    
    # Геолокация (приоритет: ручная → EXIF)
    if latitude is not None and longitude is not None:
        photo.location = {
            "type": "Point",
            "coordinates": [longitude, latitude]
        }
    elif exif_data['latitude'] and exif_data['longitude']:
        photo.location = {
            "type": "Point",
            "coordinates": [exif_data['longitude'], exif_data['latitude']]
        }
    
    # EXIF метаданные
    if exif_data['timestamp']:
        photo.timestamp_taken = exif_data['timestamp']
    if exif_data['camera_model']:
        photo.camera_model = exif_data['camera_model']
    
    await photo.insert()
    return photo


@router.get("/{photo_id}", response_model=PhotoResponse)
async def get_photo(
    photo_id: str,
    current_user: User = Depends(get_current_user)
):
    """Получить фото по ID"""
    photo = await Photo.get(photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Фото с ID {photo_id} не найдено"
        )
    return photo


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: str,
    current_user: User = Depends(get_current_user)
):
    """Удалить фото"""
    photo = await Photo.get(photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Фото с ID {photo_id} не найдено"
        )
    
    # Удаляем файл с диска
    import os
    if os.path.exists(photo.file_path):
        os.remove(photo.file_path)
    
    # Удаляем из БД
    await photo.delete()