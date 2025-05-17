from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from typing import Optional, List
from enum import Enum
from bson import ObjectId

# Define user roles
class UserRole(str, Enum):
    STUDENT = "student"
    STAFF = "staff"
    PRINCIPAL = "principal"

# Initialize FastAPI app
app = FastAPI(title="Auth API")

# Configure CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URL = "mongodb+srv://ashishcheruku:2FZEhb4kIQZmvp28@cluster0.d4x4s0c.mongodb.net/"
client = MongoClient(MONGODB_URL)
db = client["user_auth_db"]
users_collection = db["users"]
announcements_collection = db["announcements"]
faculty_collection = db["faculty"]

# Security configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = "YOUR_SECRET_KEY_HERE"  # In production, use a secure secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Helper class to convert MongoDB ObjectId to string
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole = UserRole.STUDENT  # Default role is student

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None

class UserResponse(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    role: UserRole
    created_at: datetime

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

class UpdateUserRole(BaseModel):
    role: UserRole

class UpdateUserPassword(BaseModel):
    password: str

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    link: Optional[str] = None
    link_text: Optional[str] = None
    
class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    link: Optional[str] = None
    link_text: Optional[str] = None
    
class AnnouncementResponse(BaseModel):
    id: str
    title: str
    content: str
    link: Optional[str] = None
    link_text: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

# Faculty Models
class FacultyCreate(BaseModel):
    name: str
    position: str
    department: str
    education: str
    experience: str
    
class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    
class FacultyResponse(BaseModel):
    id: str
    name: str
    position: str
    department: str
    education: str
    experience: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    user = users_collection.find_one({"username": username})
    return user

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_principal(current_user = Depends(get_current_user)):
    if current_user.get("role") != UserRole.PRINCIPAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Principal access required"
        )
    return current_user

async def get_current_active_staff(current_user = Depends(get_current_user)):
    if current_user.get("role") not in [UserRole.STAFF, UserRole.PRINCIPAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Staff access required"
        )
    return current_user

# Endpoints
@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    # Check if username already exists
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "role": UserRole.STUDENT,  # Always assign student role by default
        "created_at": datetime.utcnow()
    }
    
    users_collection.insert_one(user_data)
    
    return {"message": "User registered successfully"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user.get("role", UserRole.STUDENT)}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.get("role", UserRole.STUDENT)}

@app.get("/users/me")
async def read_users_me(current_user = Depends(get_current_user)):
    user_data = {
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user.get("role", UserRole.STUDENT)
    }
    return user_data

@app.get("/principal/dashboard")
async def principal_dashboard(current_user = Depends(get_current_active_principal)):
    # Count users by role
    total_students = users_collection.count_documents({"role": UserRole.STUDENT})
    total_staff = users_collection.count_documents({"role": UserRole.STAFF})
    total_principals = users_collection.count_documents({"role": UserRole.PRINCIPAL})
    
    # For departments, we'll use a placeholder since we don't have a departments collection yet
    # In a real application, this would be a count from the departments collection
    departments = 5
    
    return {
        "message": "Principal dashboard",
        "statistics": {
            "total_students": total_students,
            "total_staff": total_staff, 
            "total_principals": total_principals,
            "departments": departments
        }
    }

@app.get("/staff/dashboard")
async def staff_dashboard(current_user = Depends(get_current_active_staff)):
    # Staff-only data and functionality
    return {
        "message": "Staff dashboard",
        "classes": ["Class 1", "Class 2", "Class 3"]
    }

# User management endpoints - Principal only

@app.get("/users", response_model=List[UserResponse])
async def get_all_users(current_user = Depends(get_current_active_principal)):
    """Get all users - Principal only endpoint"""
    users = []
    for user in users_collection.find():
        users.append({
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user.get("role", UserRole.STUDENT),
            "created_at": user["created_at"]
        })
    return users

@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, current_user = Depends(get_current_active_principal)):
    """Create a new user - Principal only endpoint"""
    # Check if username already exists
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "role": user.role,  # Allow principal to set role
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_data)
    
    # Return created user
    created_user = users_collection.find_one({"_id": result.inserted_id})
    return {
        "id": str(created_user["_id"]),
        "username": created_user["username"],
        "email": created_user["email"],
        "role": created_user["role"],
        "created_at": created_user["created_at"]
    }

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user_role(user_id: str, update_data: UpdateUserRole, current_user = Depends(get_current_active_principal)):
    """Update a user's role - Principal only endpoint"""
    # Check if user exists
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user role
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": update_data.role}}
    )
    
    # Return updated user
    updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
    return {
        "id": str(updated_user["_id"]),
        "username": updated_user["username"],
        "email": updated_user["email"],
        "role": updated_user["role"],
        "created_at": updated_user["created_at"]
    }

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, current_user = Depends(get_current_active_principal)):
    """Delete a user - Principal only endpoint"""
    # Check if user exists
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Cannot delete self
    if str(user["_id"]) == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Delete user
    users_collection.delete_one({"_id": ObjectId(user_id)})
    return None

@app.put("/users/{user_id}/password", response_model=UserResponse)
async def update_user_password(user_id: str, update_data: UpdateUserPassword, current_user = Depends(get_current_active_principal)):
    """Update a user's password - Principal only endpoint"""
    # Check if user exists
    user_object_id = ObjectId(user_id)
    user = users_collection.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Hash the new password
    hashed_password = get_password_hash(update_data.password)
    
    # Update the password
    users_collection.update_one(
        {"_id": user_object_id},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    # Return updated user data
    updated_user = users_collection.find_one({"_id": user_object_id})
    return {
        "id": str(updated_user["_id"]),
        "username": updated_user["username"],
        "email": updated_user["email"],
        "role": updated_user.get("role", UserRole.STUDENT),
        "created_at": updated_user["created_at"]
    }

@app.get("/")
async def root():
    return {"message": "Authentication API is running"}

# Announcement endpoints

@app.get("/announcements", response_model=List[AnnouncementResponse])
async def get_all_announcements():
    """Get all announcements - Public endpoint"""
    announcements = []
    for announcement in announcements_collection.find().sort("created_at", -1):
        announcements.append({
            "id": str(announcement["_id"]),
            "title": announcement["title"],
            "content": announcement["content"],
            "link": announcement.get("link"),
            "link_text": announcement.get("link_text"),
            "created_at": announcement["created_at"],
            "updated_at": announcement.get("updated_at")
        })
    return announcements

@app.post("/announcements", status_code=status.HTTP_201_CREATED, response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate, current_user = Depends(get_current_active_principal)):
    """Create a new announcement - Principal only endpoint"""
    now = datetime.utcnow()
    announcement_data = {
        "title": announcement.title,
        "content": announcement.content,
        "link": announcement.link,
        "link_text": announcement.link_text,
        "created_at": now,
        "updated_at": None
    }
    
    result = announcements_collection.insert_one(announcement_data)
    
    # Return created announcement
    created_announcement = announcements_collection.find_one({"_id": result.inserted_id})
    return {
        "id": str(created_announcement["_id"]),
        "title": created_announcement["title"],
        "content": created_announcement["content"],
        "link": created_announcement.get("link"),
        "link_text": created_announcement.get("link_text"),
        "created_at": created_announcement["created_at"],
        "updated_at": created_announcement.get("updated_at")
    }

@app.put("/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(announcement_id: str, announcement: AnnouncementUpdate, current_user = Depends(get_current_active_principal)):
    """Update an announcement - Principal only endpoint"""
    # Check if announcement exists
    announcement_object_id = ObjectId(announcement_id)
    existing_announcement = announcements_collection.find_one({"_id": announcement_object_id})
    if not existing_announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Prepare update data
    update_data = {}
    if announcement.title is not None:
        update_data["title"] = announcement.title
    if announcement.content is not None:
        update_data["content"] = announcement.content
    if announcement.link is not None:
        update_data["link"] = announcement.link
    if announcement.link_text is not None:
        update_data["link_text"] = announcement.link_text
    
    # Only update if there are changes
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        announcements_collection.update_one(
            {"_id": announcement_object_id},
            {"$set": update_data}
        )
    
    # Return updated announcement
    updated_announcement = announcements_collection.find_one({"_id": announcement_object_id})
    return {
        "id": str(updated_announcement["_id"]),
        "title": updated_announcement["title"],
        "content": updated_announcement["content"],
        "link": updated_announcement.get("link"),
        "link_text": updated_announcement.get("link_text"),
        "created_at": updated_announcement["created_at"],
        "updated_at": updated_announcement.get("updated_at")
    }

@app.delete("/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(announcement_id: str, current_user = Depends(get_current_active_principal)):
    """Delete an announcement - Principal only endpoint"""
    # Check if announcement exists
    announcement_object_id = ObjectId(announcement_id)
    existing_announcement = announcements_collection.find_one({"_id": announcement_object_id})
    if not existing_announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Delete announcement
    announcements_collection.delete_one({"_id": announcement_object_id})
    return None

# Faculty management endpoints

@app.get("/faculty", response_model=List[FacultyResponse])
async def get_all_faculty():
    """Get all faculty members - Public endpoint"""
    faculty_members = []
    for faculty in faculty_collection.find().sort("name", 1):
        faculty_members.append({
            "id": str(faculty["_id"]),
            "name": faculty["name"],
            "position": faculty["position"],
            "department": faculty["department"],
            "education": faculty["education"],
            "experience": faculty["experience"],
            "created_at": faculty.get("created_at", datetime.utcnow()),
            "updated_at": faculty.get("updated_at")
        })
    return faculty_members

@app.post("/faculty", status_code=status.HTTP_201_CREATED, response_model=FacultyResponse)
async def create_faculty(faculty: FacultyCreate, current_user = Depends(get_current_active_principal)):
    """Create a new faculty member - Principal only endpoint"""
    now = datetime.utcnow()
    faculty_data = {
        "name": faculty.name,
        "position": faculty.position,
        "department": faculty.department,
        "education": faculty.education,
        "experience": faculty.experience,
        "created_at": now,
        "updated_at": None
    }
    
    result = faculty_collection.insert_one(faculty_data)
    
    # Return created faculty member
    created_faculty = faculty_collection.find_one({"_id": result.inserted_id})
    return {
        "id": str(created_faculty["_id"]),
        "name": created_faculty["name"],
        "position": created_faculty["position"],
        "department": created_faculty["department"],
        "education": created_faculty["education"],
        "experience": created_faculty["experience"],
        "created_at": created_faculty["created_at"],
        "updated_at": created_faculty.get("updated_at")
    }

@app.put("/faculty/{faculty_id}", response_model=FacultyResponse)
async def update_faculty(faculty_id: str, faculty: FacultyUpdate, current_user = Depends(get_current_active_principal)):
    """Update a faculty member - Principal only endpoint"""
    # Check if faculty exists
    faculty_object_id = ObjectId(faculty_id)
    existing_faculty = faculty_collection.find_one({"_id": faculty_object_id})
    if not existing_faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty member not found"
        )
    
    # Prepare update data
    update_data = {}
    if faculty.name is not None:
        update_data["name"] = faculty.name
    if faculty.position is not None:
        update_data["position"] = faculty.position
    if faculty.department is not None:
        update_data["department"] = faculty.department
    if faculty.education is not None:
        update_data["education"] = faculty.education
    if faculty.experience is not None:
        update_data["experience"] = faculty.experience
    
    # Only update if there are changes
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        faculty_collection.update_one(
            {"_id": faculty_object_id},
            {"$set": update_data}
        )
    
    # Return updated faculty
    updated_faculty = faculty_collection.find_one({"_id": faculty_object_id})
    return {
        "id": str(updated_faculty["_id"]),
        "name": updated_faculty["name"],
        "position": updated_faculty["position"],
        "department": updated_faculty["department"],
        "education": updated_faculty["education"],
        "experience": updated_faculty["experience"],
        "created_at": updated_faculty["created_at"],
        "updated_at": updated_faculty.get("updated_at")
    }

@app.delete("/faculty/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(faculty_id: str, current_user = Depends(get_current_active_principal)):
    """Delete a faculty member - Principal only endpoint"""
    # Check if faculty exists
    faculty_object_id = ObjectId(faculty_id)
    existing_faculty = faculty_collection.find_one({"_id": faculty_object_id})
    if not existing_faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty member not found"
        )
    
    # Delete faculty
    faculty_collection.delete_one({"_id": faculty_object_id})
    return None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 