from pymongo import MongoClient
from config.settings import MONGODB_URL, DATABASE_NAME, USERS_COLLECTION

def verify_users():
    # Create MongoDB client
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db[USERS_COLLECTION]
    
    # Get all users
    users = list(users_collection.find())
    
    print(f"Total users: {len(users)}")
    
    # Display user information
    for user in users:
        print(f"User ID: {user['_id']}")
        print(f"Username: {user['username']}")
        print(f"Email: {user['email']}")
        print(f"Role: {user['role']}")
        print(f"Created at: {user['created_at']}")
        print("-" * 40)

if __name__ == "__main__":
    verify_users() 