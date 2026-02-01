"""
MongoDB Connection - Shared database access for AI Service.

Collections:
- invoices: Invoice records (shared with BACKEND)
- organizations: Organization records with templates (shared with BACKEND)
"""
from pymongo import MongoClient
from app.core.config import settings

client = MongoClient(settings.MONGO_URI)
db = client[settings.MONGO_DB]

# Collections
invoices = db["invoices"]
organizations = db["organizations"]


def get_database():
    """Get MongoDB database instance"""
    return db
