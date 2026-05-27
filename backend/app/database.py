from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings

client = AsyncIOMotorClient(settings.mongo_url)
database = client.get_database(settings.database_name)

async def init_db():
    """Инициализация БД при старте"""
    from app.models.user import User
    from app.models.object import InspectionObject
    from app.models.equipment import Equipment
    from app.models.issue import Issue
    from app.models.photo import Photo
    from app.models.schema import Schema

    await init_beanie(
        database=database, # type: ignore
        document_models=[
            User,
            InspectionObject,
            Equipment,
            Issue,
            Photo,
            Schema
        ]

    )
    