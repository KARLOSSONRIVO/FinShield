import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
MONGO_DB = os.getenv("MONGO_DB", "finshield")
IPFS_GATEWAY_BASE = os.getenv("IPFS_GATEWAY_BASE", "https://gateway.pinata.cloud/ipfs")
