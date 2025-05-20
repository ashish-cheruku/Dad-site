from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.user import UserRole

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

# New schema for user permissions
class UserPermissions(BaseModel):
    can_add_student: bool = False
    can_edit_student: bool = False
    can_delete_student: bool = False
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        } 