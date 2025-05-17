from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime

# MongoDB connection
MONGODB_URL = "mongodb+srv://ashishcheruku:2FZEhb4kIQZmvp28@cluster0.d4x4s0c.mongodb.net/"
client = MongoClient(MONGODB_URL)
db = client["user_auth_db"]
users_collection = db["users"]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_or_update_principal():
    # Check if the email exists
    existing_user = users_collection.find_one({"email": "skcheruku@gmail.com"})
    
    if existing_user:
        # If the user exists, check their current role
        if existing_user.get("role") == "principal":
            print(f"User with email 'skcheruku@gmail.com' is already a principal.")
            print(f"Username: {existing_user['username']}")
            return
        
        # Update the role to principal and set the password if the username matches
        if existing_user["username"] == "sharathkumar":
            hashed_password = get_password_hash("skcheruku@1")
            users_collection.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {"role": "principal", "hashed_password": hashed_password}}
            )
            print("User updated to principal role successfully!")
            print(f"Username: sharathkumar")
            print(f"Email: skcheruku@gmail.com")
            return
        else:
            print(f"Email 'skcheruku@gmail.com' is already used by username '{existing_user['username']}'.")
            return
    
    # Check if the username exists
    existing_username = users_collection.find_one({"username": "sharathkumar"})
    
    if existing_username:
        print(f"Username 'sharathkumar' is already used with email '{existing_username['email']}'.")
        return
    
    # If neither email nor username exists, create a new principal user
    hashed_password = get_password_hash("skcheruku@1")
    principal_data = {
        "username": "sharathkumar",
        "email": "skcheruku@gmail.com",
        "hashed_password": hashed_password,
        "role": "principal",
        "created_at": datetime.utcnow()
    }
    
    # Insert the user
    result = users_collection.insert_one(principal_data)
    
    if result.inserted_id:
        print("Principal user created successfully!")
        print(f"Username: sharathkumar")
        print(f"Email: skcheruku@gmail.com")
    else:
        print("Failed to create principal user.")

if __name__ == "__main__":
    create_or_update_principal() 