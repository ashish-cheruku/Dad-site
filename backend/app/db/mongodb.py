from pymongo import MongoClient
from config.settings import MONGODB_URL, DATABASE_NAME, USERS_COLLECTION, ANNOUNCEMENTS_COLLECTION, FACULTY_COLLECTION

# Create MongoDB client
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db[USERS_COLLECTION]
announcements_collection = db[ANNOUNCEMENTS_COLLECTION]
faculty_collection = db[FACULTY_COLLECTION] 