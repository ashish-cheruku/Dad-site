from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId
from app.schemas.faculty import FacultyCreate, FacultyUpdate, FacultyResponse
from app.services.auth import get_current_active_principal
from app.db.mongodb import faculty_collection

router = APIRouter()

@router.get("", response_model=List[FacultyResponse])
async def get_all_faculty():
    faculty_members = []
    for faculty in faculty_collection.find().sort("name", 1):
        faculty_members.append({
            "id": str(faculty["_id"]),
            "name": faculty["name"],
            "position": faculty["position"],
            "department": faculty["department"],
            "education": faculty["education"],
            "experience": faculty["experience"],
            "created_at": faculty["created_at"],
            "updated_at": faculty.get("updated_at")
        })
    return faculty_members

@router.post("", status_code=status.HTTP_201_CREATED, response_model=FacultyResponse)
async def create_faculty(faculty: FacultyCreate, current_user = Depends(get_current_active_principal)):
    faculty_data = {
        "name": faculty.name,
        "position": faculty.position,
        "department": faculty.department,
        "education": faculty.education,
        "experience": faculty.experience,
        "created_at": datetime.utcnow()
    }
    
    result = faculty_collection.insert_one(faculty_data)
    
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

@router.put("/{faculty_id}", response_model=FacultyResponse)
async def update_faculty(faculty_id: str, faculty: FacultyUpdate, current_user = Depends(get_current_active_principal)):
    try:
        faculty_obj_id = ObjectId(faculty_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid faculty ID format"
        )
    
    existing_faculty = faculty_collection.find_one({"_id": faculty_obj_id})
    if not existing_faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty member not found"
        )
    
    update_data = {
        "updated_at": datetime.utcnow()
    }
    
    # Only update fields that are provided
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
    
    faculty_collection.update_one(
        {"_id": faculty_obj_id},
        {"$set": update_data}
    )
    
    updated_faculty = faculty_collection.find_one({"_id": faculty_obj_id})
    
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

@router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(faculty_id: str, current_user = Depends(get_current_active_principal)):
    try:
        faculty_obj_id = ObjectId(faculty_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid faculty ID format"
        )
    
    existing_faculty = faculty_collection.find_one({"_id": faculty_obj_id})
    if not existing_faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty member not found"
        )
    
    faculty_collection.delete_one({"_id": faculty_obj_id})
    return None 