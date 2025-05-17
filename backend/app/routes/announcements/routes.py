from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from app.services.auth import get_current_active_principal
from app.db.mongodb import announcements_collection

router = APIRouter()

@router.get("", response_model=List[AnnouncementResponse])
async def get_all_announcements():
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

@router.post("", status_code=status.HTTP_201_CREATED, response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate, current_user = Depends(get_current_active_principal)):
    announcement_data = {
        "title": announcement.title,
        "content": announcement.content,
        "link": announcement.link,
        "link_text": announcement.link_text,
        "created_at": datetime.utcnow()
    }
    
    # Filter out None values
    announcement_data = {k: v for k, v in announcement_data.items() if v is not None}
    
    result = announcements_collection.insert_one(announcement_data)
    
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

@router.put("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(announcement_id: str, announcement: AnnouncementUpdate, current_user = Depends(get_current_active_principal)):
    try:
        announcement_obj_id = ObjectId(announcement_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid announcement ID format"
        )
    
    existing_announcement = announcements_collection.find_one({"_id": announcement_obj_id})
    if not existing_announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    update_data = {
        "updated_at": datetime.utcnow()
    }
    
    # Only update fields that are provided
    if announcement.title is not None:
        update_data["title"] = announcement.title
    if announcement.content is not None:
        update_data["content"] = announcement.content
    if announcement.link is not None:
        update_data["link"] = announcement.link
    if announcement.link_text is not None:
        update_data["link_text"] = announcement.link_text
    
    announcements_collection.update_one(
        {"_id": announcement_obj_id},
        {"$set": update_data}
    )
    
    updated_announcement = announcements_collection.find_one({"_id": announcement_obj_id})
    
    return {
        "id": str(updated_announcement["_id"]),
        "title": updated_announcement["title"],
        "content": updated_announcement["content"],
        "link": updated_announcement.get("link"),
        "link_text": updated_announcement.get("link_text"),
        "created_at": updated_announcement["created_at"],
        "updated_at": updated_announcement.get("updated_at")
    }

@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(announcement_id: str, current_user = Depends(get_current_active_principal)):
    try:
        announcement_obj_id = ObjectId(announcement_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid announcement ID format"
        )
    
    existing_announcement = announcements_collection.find_one({"_id": announcement_obj_id})
    if not existing_announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    announcements_collection.delete_one({"_id": announcement_obj_id})
    return None 