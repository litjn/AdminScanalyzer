from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "ScanalyzerDB"

client = AsyncIOMotorClient(MONGO_URI)
database = client[DB_NAME]
log_collection = database.get_collection("logs")
