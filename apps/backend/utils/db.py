from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

from utils.settings import get_settings

settings = get_settings()

client = AsyncIOMotorClient(settings.MONGO_DB_URI, server_api=ServerApi("1"))
db = client["db"]


async def create_users_collection_if_not_exists() -> None:
    if "users" not in await db.list_collection_names():
        await db.create_collection("users")
