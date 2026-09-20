import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

mongodb_uri = os.getenv("MONGODB_URI")
db_name = os.getenv("DB_NAME")

client = AsyncIOMotorClient(mongodb_uri) if mongodb_uri else None
database = client[db_name] if client and db_name else None
users_collection = database["users"] if database is not None else None
interviews_collection = database["interviews"] if database is not None else None


async def ping_database():
    if client is None or database is None:
        raise RuntimeError("MONGODB_URI or DB_NAME is not set")

    await client.admin.command("ping")
