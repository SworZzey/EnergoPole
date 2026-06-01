import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.database import init_db
from app.config import settings

from app.routers import auth, projects, notes, tasks, photos, schemas, sync


async def seed_demo_users():
    """Создать демо-пользователей если их нет"""
    from app.crud.user import get_user_by_email, create_user
    from app.schemas.user import UserCreate

    demo_users = [
        {"email": "user@example.com", "password": "password", "full_name": "Инженер Иванов", "role": "engineer"},
        {"email": "manager@example.com", "password": "manager", "full_name": "Менеджер Сидоров", "role": "manager"},
    ]

    for u in demo_users:
        existing = await get_user_by_email(u["email"])
        if existing:
            if existing.role != u["role"]:
                existing.role = u["role"]
                await existing.save()
            continue

        user_data = UserCreate(email=u["email"], password=u["password"], full_name=u["full_name"])
        user = await create_user(user_data)
        user.role = u["role"]
        await user.save()
        print(f"Создан демо-пользователь: {u['email']} ({u['role']})")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_demo_users()
    print("БД инициализирована")
    yield
    print("Завершение работы")

app = FastAPI(
    title="Field Survey API",
    description="API системы полевого обследования объектов электроснабжения для АО \"РИМ\"",
    version="0.0.2",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API (все под /api) ──────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(photos.router, prefix="/api")
app.include_router(schemas.router, prefix="/api")
app.include_router(sync.router, prefix="/api")

# ── Статика ─────────────────────────────────────────────────
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# ── SPA (сборка фронта) ─────────────────────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "..", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")


@app.get("/health")
def health():
    return {"status": "healthy", "database": "MongoDB"}

