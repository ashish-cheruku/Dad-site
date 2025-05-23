import os
from datetime import timedelta

# MongoDB Configuration
# This is the current connection string
MONGODB_URL = "mongodb+srv://gjcvemulawada:8Qe280Xl5e5jYHwA@cluster0.qitynax.mongodb.net/user_auth_db"
DATABASE_NAME = "user_auth_db"

# Collections
USERS_COLLECTION = "users"
ANNOUNCEMENTS_COLLECTION = "announcements"
FACULTY_COLLECTION = "faculty"
STUDENTS_COLLECTION = "students"
ATTENDANCE_COLLECTION = "attendance"
EXAMS_COLLECTION = "exams"
PERMISSIONS_COLLECTION = "permissions"

# Security Configuration
SECRET_KEY = "YOUR_SECRET_KEY_HERE"  # In production, use a secure secret key stored in environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120  # Increased to 2 hours
ACCESS_TOKEN_EXPIRE_DELTA = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

# CORS Settings
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:18081", "http://20.55.51.47:18081"]  # Frontend URL 