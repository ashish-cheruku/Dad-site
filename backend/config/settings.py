import os
from datetime import timedelta

# MongoDB Configuration
MONGODB_URL = "mongodb+srv://ashishcheruku:2FZEhb4kIQZmvp28@cluster0.d4x4s0c.mongodb.net/"
DATABASE_NAME = "user_auth_db"

# Collections
USERS_COLLECTION = "users"
ANNOUNCEMENTS_COLLECTION = "announcements"
FACULTY_COLLECTION = "faculty"

# Security Configuration
SECRET_KEY = "YOUR_SECRET_KEY_HERE"  # In production, use a secure secret key stored in environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
ACCESS_TOKEN_EXPIRE_DELTA = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

# CORS Settings
CORS_ORIGINS = ["http://localhost:3000"]  # Frontend URL 