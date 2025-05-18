from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
from app.models.user import UserRole

# MongoDB Configuration from the settings file
from config.settings import MONGODB_URL, DATABASE_NAME, USERS_COLLECTION

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_principal_user():
    # Create MongoDB client
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db[USERS_COLLECTION]
    
    # Check if principal user already exists
    existing_user = users_collection.find_one({"username": "principalvmd"})
    if existing_user:
        print("Principal user already exists!")
        return
    
    # Create principal user
    principal_data = {
        "username": "principalvmd",
        "email": "skcheruku@gmail.com",
        "hashed_password": get_password_hash("skcheruku@1"),
        "role": UserRole.PRINCIPAL,
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(principal_data)
    
    if result.inserted_id:
        print("Principal user created successfully!")
        print(f"User ID: {result.inserted_id}")
    else:
        print("Failed to create principal user.")

if __name__ == "__main__":
    create_principal_user() 