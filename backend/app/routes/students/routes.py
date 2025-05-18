from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
from bson import ObjectId
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.services.auth import get_current_active_staff, get_current_active_principal
from app.db.mongodb import students_collection
from app.models.student import Group, Medium

# Helper function to convert date objects to strings
def convert_dates_to_strings(data):
    """Convert date objects to ISO format strings for MongoDB compatibility"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, date):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                convert_dates_to_strings(value)
    return data

# Helper function to convert strings back to date objects
def convert_strings_to_dates(data, date_fields=["date_of_birth", "created_at", "updated_at"]):
    """Convert ISO format strings back to date objects"""
    if isinstance(data, dict):
        for key in date_fields:
            if key in data and isinstance(data[key], str):
                try:
                    data[key] = datetime.fromisoformat(data[key]).date()
                except ValueError:
                    # If it's not a valid ISO format, keep it as is
                    pass
    return data

router = APIRouter()

# Get all students with optional filtering
@router.get("/", response_model=List[StudentResponse])
async def get_all_students(
    current_user = Depends(get_current_active_staff),
    year: Optional[int] = None,
    group: Optional[Group] = None,
    medium: Optional[Medium] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get all students with optional filtering - Accessible by staff and principal"""
    query = {}
    
    # Apply filters if provided
    if year is not None:
        query["year"] = year
    if group is not None:
        query["group"] = group
    if medium is not None:
        query["medium"] = medium
    
    students = []
    cursor = students_collection.find(query).skip(skip).limit(limit)
    
    for student in cursor:
        student["id"] = str(student.pop("_id"))
        # Convert date strings back to date objects for response
        convert_strings_to_dates(student)
        students.append(student)
    
    return students

# Get a specific student by ID
@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    current_user = Depends(get_current_active_staff)
):
    """Get a specific student by ID - Accessible by staff and principal"""
    student = students_collection.find_one({"_id": ObjectId(student_id)})
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    student["id"] = str(student.pop("_id"))
    # Convert date strings back to date objects for response
    convert_strings_to_dates(student)
    return student

# Create a new student
@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student: StudentCreate,
    current_user = Depends(get_current_active_staff)
):
    """Create a new student - Accessible by staff and principal"""
    # Check if admission number already exists
    existing_student = students_collection.find_one({"admission_number": student.admission_number})
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this admission number already exists"
        )
    
    # Check if Aadhar number already exists (if provided)
    if student.aadhar_number:
        existing_aadhar = students_collection.find_one({"aadhar_number": student.aadhar_number})
        if existing_aadhar:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student with this Aadhar number already exists"
            )
    
    # Prepare student data
    student_data = student.dict()
    student_data["created_at"] = datetime.now().date()
    
    # Convert all date objects to strings for MongoDB compatibility
    student_data = convert_dates_to_strings(student_data)
    
    # Insert into database
    result = students_collection.insert_one(student_data)
    
    # Get and return the created student
    created_student = students_collection.find_one({"_id": result.inserted_id})
    created_student["id"] = str(created_student.pop("_id"))
    
    # Convert date strings back to date objects for response
    convert_strings_to_dates(created_student)
    
    return created_student

# Update a student
@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student_update: StudentUpdate,
    current_user = Depends(get_current_active_staff)
):
    """Update a student - Accessible by staff and principal"""
    # Check if student exists
    student = students_collection.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Prepare update data (only include non-None values)
    update_data = {k: v for k, v in student_update.dict().items() if v is not None}
    
    # If there's data to update
    if update_data:
        # Check for duplicate admission number (if being updated)
        if "admission_number" in update_data and update_data["admission_number"] != student["admission_number"]:
            existing_admission = students_collection.find_one({
                "admission_number": update_data["admission_number"],
                "_id": {"$ne": ObjectId(student_id)}
            })
            if existing_admission:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student with this admission number already exists"
                )
        
        # Check for duplicate Aadhar number (if being updated)
        if "aadhar_number" in update_data and update_data["aadhar_number"] != student.get("aadhar_number"):
            existing_aadhar = students_collection.find_one({
                "aadhar_number": update_data["aadhar_number"],
                "_id": {"$ne": ObjectId(student_id)}
            })
            if existing_aadhar:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student with this Aadhar number already exists"
                )
        
        update_data["updated_at"] = datetime.now().date()
        
        # Convert all date objects to strings for MongoDB compatibility
        update_data = convert_dates_to_strings(update_data)
        
        # Update student
        students_collection.update_one(
            {"_id": ObjectId(student_id)},
            {"$set": update_data}
        )
    
    # Get and return the updated student
    updated_student = students_collection.find_one({"_id": ObjectId(student_id)})
    updated_student["id"] = str(updated_student.pop("_id"))
    
    # Convert date strings back to date objects for response
    convert_strings_to_dates(updated_student)
    
    return updated_student

# Delete a student
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: str,
    current_user = Depends(get_current_active_staff)
):
    """Delete a student - Accessible by staff and principal"""
    # Check if student exists
    student = students_collection.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Delete student
    result = students_collection.delete_one({"_id": ObjectId(student_id)})
    
    if result.deleted_count != 1:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete student"
        )
    
    return None 