import os
import uuid
from datetime import datetime
from typing import Tuple, Any
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from fastapi import UploadFile
from app.config import settings

def generate_unique_filename(original_filename: str) -> str:
    """Генерировать уникальное имя файла"""
    ext = os.path.splitext(original_filename)[1].lower()
    unique_name = f"{uuid.uuid4()}{ext}"
    return unique_name


async def save_upload_file(file: UploadFile, subfolder: str = "photos") -> Tuple[str, str, int]:
    """
    Сохранить загруженный файл
    
    Returns:
        (file_path, url, file_size)
    """
    # Создаём папку, если не существует
    upload_path = os.path.join(settings.upload_dir, subfolder)
    os.makedirs(upload_path, exist_ok=True)
    
    # Генерируем уникальное имя
    filename = generate_unique_filename(file.filename or "file")
    file_path = os.path.join(upload_path, filename)
    
    # Сохраняем файл
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # URL для доступа
    url = f"/uploads/{subfolder}/{filename}"
    file_size = len(content)
    
    return file_path, url, file_size


def extract_exif_data(image_path: str) -> dict:
    """
    Извлечь EXIF данные из изображения
    
    Returns:
        {
            'latitude': float | None,
            'longitude': float | None,
            'timestamp': datetime | None,
            'camera_model': str | None
        }
    """
    result: dict[str, Any] = {
        'latitude': None,
        'longitude': None,
        'timestamp': None,
        'camera_model': None
    }
    
    try:
        image = Image.open(image_path)
        exif_data = image.getexif()
        
        if not exif_data:
            return result
        
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            
            # Модель камеры
            if tag_name == "Model":
                result['camera_model'] = str(value)
            
            # Дата съёмки
            elif tag_name == "DateTime":
                try:
                    result['timestamp'] = datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
                except:
                    pass
            
            # GPS данные
            elif tag_name == "GPSInfo":
                gps_data = {}
                for gps_tag_id in value:
                    gps_tag_name = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_data[gps_tag_name] = value[gps_tag_id]
                
                # Извлекаем координаты
                lat, lon = _extract_coordinates(gps_data)
                result['latitude'] = lat
                result['longitude'] = lon
    
    except Exception as e:
        print(f"Ошибка извлечения EXIF: {e}")
    
    return result


def _extract_coordinates(gps_data: dict) -> Tuple[float | None, float | None]:
    """Извлечь широту и долготу из GPS данных"""
    try:
        # Широта
        lat_data = gps_data.get("GPSLatitude")
        lat_ref = gps_data.get("GPSLatitudeRef")
        
        # Долгота
        lon_data = gps_data.get("GPSLongitude")
        lon_ref = gps_data.get("GPSLongitudeRef")
        
        if not (lat_data and lon_data):
            return None, None
        
        lat = _convert_to_degrees(lat_data)
        lon = _convert_to_degrees(lon_data)
        
        # Применяем направление (N/S, E/W)
        if lat_ref == "S":
            lat = -lat
        if lon_ref == "W":
            lon = -lon
        
        return lat, lon
    
    except:
        return None, None


def _convert_to_degrees(value) -> float:
    """Конвертировать GPS координаты в десятичные градусы"""
    d = float(value[0])
    m = float(value[1])
    s = float(value[2])
    return d + (m / 60.0) + (s / 3600.0)


def validate_image_file(file: UploadFile) -> bool:
    """Проверить, что файл - изображение"""
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    return file.content_type in allowed_types


def validate_file_size(file: UploadFile, max_size: int | None = None) -> bool:
    """Проверить размер файла (требует чтения файла)"""
    if max_size is None:
        max_size = settings.max_file_size
    
    return True