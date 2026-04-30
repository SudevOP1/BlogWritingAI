from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

from utils.settings import get_settings

settings = get_settings()

client = AsyncIOMotorClient(settings.MONGO_DB_URI, server_api=ServerApi("1"))
db = client["db"]


async def create_collections_if_not_exists() -> None:
    existing = await db.list_collection_names()
    collections = ["users", "blogs", "comments", "blog_likes", "comment_likes"]
    for collection in collections:
        if collection not in existing:
            await db.create_collection(collection)
