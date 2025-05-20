from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId
from app.schemas.user import UserCreate, UserResponse, UpdateUserRole, UpdateUserPassword, UserPermissions
from app.services.auth import get_current_active_principal, get_password_hash, get_current_active_staff
from app.db.mongodb import users_collection, permissions_collection

router = APIRouter()

@router.get("", response_model=List[UserResponse])
async def get_all_users(current_user = Depends(get_current_active_principal)):
    users = []
    for user in users_collection.find():
        users.append({
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"]
        })
    return users

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, current_user = Depends(get_current_active_principal)):
    # Check if username already exists
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )
    
    # Create new user
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": get_password_hash(user.password),
        "role": user.role,
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_data)
    
    created_user = users_collection.find_one({"_id": result.inserted_id})
    
    return {
        "id": str(created_user["_id"]),
        "username": created_user["username"],
        "email": created_user["email"],
        "role": created_user["role"],
        "created_at": created_user["created_at"]
    }

@router.put("/{user_id}", response_model=UserResponse)
async def update_user_role(user_id: str, update_data: UpdateUserRole, current_user = Depends(get_current_active_principal)):
    try:
        user_obj_id = ObjectId(user_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = users_collection.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    users_collection.update_one(
        {"_id": user_obj_id},
        {"$set": {"role": update_data.role}}
    )
    
    updated_user = users_collection.find_one({"_id": user_obj_id})
    
    return {
        "id": str(updated_user["_id"]),
        "username": updated_user["username"],
        "email": updated_user["email"],
        "role": updated_user["role"],
        "created_at": updated_user["created_at"]
    }

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, current_user = Depends(get_current_active_principal)):
    try:
        user_obj_id = ObjectId(user_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = users_collection.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    users_collection.delete_one({"_id": user_obj_id})
    return None

@router.put("/{user_id}/password", response_model=UserResponse)
async def update_user_password(user_id: str, update_data: UpdateUserPassword, current_user = Depends(get_current_active_principal)):
    try:
        user_obj_id = ObjectId(user_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = users_collection.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    hashed_password = get_password_hash(update_data.password)
    
    users_collection.update_one(
        {"_id": user_obj_id},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    updated_user = users_collection.find_one({"_id": user_obj_id})
    
    return {
        "id": str(updated_user["_id"]),
        "username": updated_user["username"],
        "email": updated_user["email"],
        "role": updated_user["role"],
        "created_at": updated_user["created_at"]
    }

# Permissions Management
@router.get("/{user_id}/permissions", response_model=UserPermissions)
async def get_user_permissions(user_id: str, current_user = Depends(get_current_active_staff)):
    """Get permissions for a specific user"""
    try:
        user_obj_id = ObjectId(user_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Verify the user exists
    user = users_collection.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get permissions or return default empty permissions
    permissions = permissions_collection.find_one({"user_id": str(user_obj_id)})
    
    if not permissions:
        return UserPermissions()
    
    return UserPermissions(
        can_add_student=permissions.get("can_add_student", False),
        can_edit_student=permissions.get("can_edit_student", False),
        can_delete_student=permissions.get("can_delete_student", False)
    )

@router.put("/{user_id}/permissions", response_model=UserPermissions)
async def update_user_permissions(
    user_id: str, 
    permissions: UserPermissions, 
    current_user = Depends(get_current_active_principal)
):
    """Update permissions for a specific user (principal only)"""
    try:
        user_obj_id = ObjectId(user_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Verify the user exists
    user = users_collection.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only staff users can have permissions
    if user["role"] != "staff":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permissions can only be set for staff users"
        )
    
    # Update or create permissions
    permissions_data = {
        "user_id": str(user_obj_id),
        "can_add_student": permissions.can_add_student,
        "can_edit_student": permissions.can_edit_student,
        "can_delete_student": permissions.can_delete_student,
        "updated_at": datetime.utcnow()
    }
    
    # Upsert (update if exists, insert if not)
    permissions_collection.update_one(
        {"user_id": str(user_obj_id)},
        {"$set": permissions_data},
        upsert=True
    )
    
    return permissions 