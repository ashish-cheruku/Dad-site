from pymongo import MongoClient
from passlib.context import CryptContext
from config.settings import MONGODB_URL, DATABASE_NAME, USERS_COLLECTION

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def check_users():
    # Create MongoDB client
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db[USERS_COLLECTION]
    
    # Get all users
    users = list(users_collection.find())
    
    print(f"Total users in database: {len(users)}")
    
    # Display ALL user information
    for user in users:
        print(f"User ID: {user['_id']}")
        print(f"Username: {user.get('username', 'N/A')}")
        print(f"Email: {user.get('email', 'N/A')}")
        print(f"Role: {user.get('role', 'N/A')}")
        print(f"Created at: {user.get('created_at', 'N/A')}")
        print("Has password hash:", 'hashed_password' in user)
        print("-" * 40)
    
    # Test authentication with your old credentials
    # Replace these with your old credentials that are still working
    old_username = input("Enter old username that still works: ")
    old_password = input("Enter old password that still works: ")
    
    user = users_collection.find_one({"username": old_username})
    if user:
        print(f"Found user with username '{old_username}'")
        if 'hashed_password' in user:
            print("User has a password hash")
            if verify_password(old_password, user['hashed_password']):
                print("Password verification SUCCESSFUL with the stored hash")
            else:
                print("Password verification FAILED with the stored hash")
        else:
            print("User does not have a password hash")
    else:
        print(f"No user found with username '{old_username}'")

if __name__ == "__main__":
    check_users() 