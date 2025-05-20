from fastapi import APIRouter, Depends, Request
from app.services.auth import get_current_active_principal, get_current_active_staff, get_current_user
from app.db.mongodb import users_collection, students_collection
from app.models.user import UserRole

router = APIRouter()

@router.get("/principal")
async def principal_dashboard(current_user = Depends(get_current_active_principal)):
    # Count staff from users collection
    total_staff = users_collection.count_documents({"role": UserRole.STAFF})
    
    # Count students from students collection
    total_students = students_collection.count_documents({})
    
    return {
        "message": "Principal dashboard",
        "statistics": {
            "total_students": total_students,
            "total_staff": total_staff
        }
    }

@router.get("/staff")
async def staff_dashboard(current_user = Depends(get_current_active_staff)):
    # Staff-only data and functionality
    return {
        "message": "Staff dashboard",
        "classes": ["Class 1", "Class 2", "Class 3"]
    }

# Universal dashboard endpoint that determines the correct data to return based on the URL path
@router.get("/dashboard")
async def unified_dashboard(request: Request, current_user = Depends(get_current_user)):
    # Get the URL path to determine which dashboard data to serve
    path = request.url.path
    
    # If this is accessed via /staff/* path, return staff dashboard data
    if '/staff/' in path:
        return {
            "message": "Staff dashboard",
            "classes": ["Class 1", "Class 2", "Class 3"]
        }
    # Otherwise return principal dashboard data
    else:
        # Count staff from users collection
        total_staff = users_collection.count_documents({"role": UserRole.STAFF})
    
        # Count students from students collection
        total_students = students_collection.count_documents({})
        
        return {
            "message": "Principal dashboard",
            "statistics": {
                "total_students": total_students,
                "total_staff": total_staff
            }
        } 