from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

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