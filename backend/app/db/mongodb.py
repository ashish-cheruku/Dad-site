from pymongo import MongoClient
from config.settings import MONGODB_URL, DATABASE_NAME, USERS_COLLECTION, ANNOUNCEMENTS_COLLECTION, FACULTY_COLLECTION, STUDENTS_COLLECTION, ATTENDANCE_COLLECTION

# Debug - print connection string
print(f"Connecting to MongoDB with URL: {MONGODB_URL}")

# Create MongoDB client
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db[USERS_COLLECTION]
announcements_collection = db[ANNOUNCEMENTS_COLLECTION]
faculty_collection = db[FACULTY_COLLECTION]
students_collection = db[STUDENTS_COLLECTION]
attendance_collection = db[ATTENDANCE_COLLECTION] 