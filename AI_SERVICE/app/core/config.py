import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")
IPFS_GATEWAY_BASE = os.getenv("IPFS_GATEWAY_BASE")
