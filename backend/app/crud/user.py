from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Хешировать пароль"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверить пароль"""
    return pwd_context.verify(plain_password, hashed_password)


async def create_user(user_data: UserCreate) -> User:
    """Создать пользователя"""
    
    user_dict = user_data.model_dump()
    password = user_dict.pop("password")
    
    user = User(
        **user_dict,
        hashed_password=hash_password(password)
    )
    
    await user.insert()
    return user


async def get_user_by_email(email: str) -> User | None:
    """Найти пользователя по email"""
    return await User.find_one(User.email == email)


async def get_user(user_id: str) -> User | None:
    """Получить пользователя по ID"""
    return await User.get(user_id)


async def update_user(user_id: str, user_data: UserUpdate) -> User | None:
    """Обновить профиль пользователя"""
    
    user = await User.get(user_id)
    if not user:
        return None
    
    update_data = user_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    user.updated_at = datetime.now()
    
    await user.save()
    return user


async def authenticate_user(email: str, password: str) -> User | None:
    """Аутентификация пользователя"""
    
    user = await get_user_by_email(email)
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    

    user.last_login = datetime.now()
    await user.save()
    
    return user