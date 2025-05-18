from pymongo import MongoClient
import sys

# Import settings directly
from config.settings import MONGODB_URL, DATABASE_NAME, USERS_COLLECTION

# Also import from app to check what it's using
from app.db.mongodb import client as app_client, db as app_db

def debug_connection():
    print("=" * 50)
    print("MongoDB Connection Debug")
    print("=" * 50)
    
    # Check what's in settings.py
    print(f"Settings MONGODB_URL: {MONGODB_URL}")
    print(f"Settings DATABASE_NAME: {DATABASE_NAME}")
    
    # Try direct connection using settings
    print("\nTrying direct connection with settings...")
    try:
        direct_client = MongoClient(MONGODB_URL)
        direct_db = direct_client[DATABASE_NAME]
        print(f"Direct connection successful. Server version: {direct_client.server_info().get('version')}")
        print(f"Direct connection database name: {direct_db.name}")
        users = list(direct_db[USERS_COLLECTION].find())
        print(f"Direct connection user count: {len(users)}")
        if len(users) > 0:
            print(f"First user username: {users[0].get('username')}")
    except Exception as e:
        print(f"Direct connection error: {str(e)}")
    
    # Check what the app is using
    print("\nChecking what the app is using...")
    try:
        print(f"App database name: {app_db.name}")
        app_users = list(app_db[USERS_COLLECTION].find())
        print(f"App user count: {len(app_users)}")
        if len(app_users) > 0:
            print(f"First app user username: {app_users[0].get('username')}")
    except Exception as e:
        print(f"App connection error: {str(e)}")
    
    # Try to determine if it's using the same client
    print("\nChecking if using the same connection...")
    try:
        app_server_info = app_client.server_info()
        direct_server_info = direct_client.server_info()
        print(f"App server build: {app_server_info.get('version')}")
        print(f"Direct server build: {direct_server_info.get('version')}")
        
        # This is a bit of a hack, but may help identify if they're the same
        print(f"App client id: {id(app_client)}")
        print(f"Direct client id: {id(direct_client)}")
    except Exception as e:
        print(f"Comparison error: {str(e)}")

if __name__ == "__main__":
    debug_connection() 