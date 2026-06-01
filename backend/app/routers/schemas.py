from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List
from app.schemas.schema import SchemaResponse, AnnotationCreate
from app.models.schema import Schema
from app.auth import get_current_user
from app.models.user import User
from app.utils import save_upload_file, validate_image_file
from beanie import PydanticObjectId

router = APIRouter(prefix="/schemas", tags=["Схемы"])


@router.post("/", response_model=SchemaResponse, status_code=status.HTTP_201_CREATED)
async def upload_schema(
    file: UploadFile = File(...),
    object_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Загрузить схему объекта"""
    
    if not validate_image_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть изображением"
        )
    
    # Сохраняем оригинал
    file_path, url, file_size = await save_upload_file(file, subfolder="schemas")
    
    # Создаём запись
    schema = Schema(
        filename=file.filename or "schema",
        file_path=file_path,
        url=url,
        file_size=file_size,
        mime_type=file.content_type or "image/png",
        object_id=PydanticObjectId(object_id),
        title=title,
        description=description,
        uploaded_by=PydanticObjectId(str(current_user.id)),
        # Гибридный подход
        original_file_path=file_path,
        original_url=url
    )
    
    await schema.insert()
    return schema


@router.get("/object/{object_id}", response_model=List[SchemaResponse])
async def get_schemas_by_object(
    object_id: str,
    current_user: User = Depends(get_current_user)
):
    """Получить все схемы объекта"""
    schemas = await Schema.find(
        Schema.object_id == PydanticObjectId(object_id)
    ).to_list()
    return schemas


@router.post("/{schema_id}/annotations", response_model=SchemaResponse)
async def add_annotation(
    schema_id: str,
    annotation: AnnotationCreate,
    current_user: User = Depends(get_current_user)
):
    """Добавить пометку на схему"""
    schema = await Schema.get(schema_id)
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Схема не найдена"
        )
    
    # Добавляем пометку в массив
    schema.annotations.append(annotation.model_dump())
    schema.sync_version += 1
    await schema.save()
    
    return schema


@router.delete("/{schema_id}/annotations/{annotation_index}", response_model=SchemaResponse)
async def delete_annotation(
    schema_id: str,
    annotation_index: int,
    current_user: User = Depends(get_current_user)
):
    """Удалить пометку со схемы"""
    schema = await Schema.get(schema_id)
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Схема не найдена"
        )
    
    if annotation_index >= len(schema.annotations):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный индекс пометки"
        )
    
    schema.annotations.pop(annotation_index)
    schema.sync_version += 1
    await schema.save()
    
    return schema