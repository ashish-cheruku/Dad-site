from fastapi import APIRouter, Depends
from app.services.auth import get_current_active_principal, get_current_active_staff
from app.db.mongodb import users_collection
from app.models.user import UserRole

router = APIRouter()

@router.get("/principal")
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

@router.get("/staff")
async def staff_dashboard(current_user = Depends(get_current_active_staff)):
    # Staff-only data and functionality
    return {
        "message": "Staff dashboard",
        "classes": ["Class 1", "Class 2", "Class 3"]
    } 