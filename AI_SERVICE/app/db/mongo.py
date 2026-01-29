from pymongo import MongoClient
from app.core.config import MONGO_URI, MONGO_DB

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]
invoices = db["invoices"]
template_embeddings = db["template_embeddings"]

