from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_serializer
from beanie import PydanticObjectId
from datetime import datetime


class UserBase(BaseModel):
    """Базовый класс пользователя"""
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=200)

class UserCreate(UserBase):
    """Схема для регистрации пользователя"""
    password: str = Field(min_length=6, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "inspector@example.com",
                "full_name": "Иван Иванов",
                "password": "SecurePass123"
            }
        }
    )

class UserLogin(BaseModel):
    """Схема для входа"""
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    """Схема для обновления профиля"""
    full_name: str | None = Field(None, min_length=2, max_length=200)

class UserResponse(BaseModel):
    """Схема ответа — поле name приходит как full_name из БД"""
    id: PydanticObjectId
    email: EmailStr
    name: str = Field(alias="full_name")
    role: str | None = None
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    last_login: datetime | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_serializer('id')
    def serialize_id(self, value: PydanticObjectId) -> str:
        return str(value)
    

class Token(BaseModel):
    """JWT Token"""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Данные внутри JWT токена"""
    user_id: str | None = None