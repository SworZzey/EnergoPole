from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings

client = AsyncIOMotorClient(settings.mongo_url)
database = client.get_database(settings.database_name)

async def init_db():
    """Инициализация БД при старте"""
    from app.models.user import User
    from app.models.project import Project
    from app.models.note import Note
    from app.models.task import Task
    from app.models.photo import Photo
    from app.models.schema import Schema

    await init_beanie(
        database=database, # type: ignore
        document_models=[
            User,
            Project,
            Note,
            Task,
            Photo,
            Schema
        ]

    )
    