from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

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