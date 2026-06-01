from beanie import Document
from pydantic import Field, EmailStr
from datetime import datetime


class User(Document):
    """Пользователь (инспектор)"""

    email: EmailStr
    hashed_password: str
    full_name: str

    role: str | None = None

    is_active: bool = True
    is_verified: bool = False
    

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = None
    last_login: datetime | None = None
    
    class Settings:
        name = "users"

        indexes = [
            "email",
            "full_name"
        ]

    class Config:
        json_schema_extra = {
            "example": {
                "email": "inspector@example.com",
                "full_name": "Иван Иванов",
                "role": "Электромонтёр 5-го разряда"
            }
        }