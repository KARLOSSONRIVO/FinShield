"""
MongoDB Connection - Shared database access for AI Service.

Collections:
- invoices: Invoice records (shared with BACKEND)
- organizations: Organization records with templates (shared with BACKEND)
"""
from pymongo import MongoClient
from app.core.config import MONGO_URI, MONGO_DB

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]

# Collections
invoices = db["invoices"]
organizations = db["organizations"]

