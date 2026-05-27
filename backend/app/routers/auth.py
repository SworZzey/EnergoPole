from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import UserCreate, UserLogin, UserResponse, Token
from app.crud import create_user, authenticate_user, get_user_by_email
from app.auth import create_access_token, get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Аутентификация"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Регистрация нового пользователя"""
    
    existing_user = await get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    user = await create_user(user_data)
    return user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Вход в систему"""
    
    user = await authenticate_user(credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    return current_user