from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict
from datetime import datetime
from bson import ObjectId
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse, StudentExamsSummary, GroupSubjects
from app.services.auth import get_current_active_staff, get_current_active_principal
from app.db.mongodb import exams_collection, students_collection
from app.models.exam import SubjectsByGroup, ExamType

router = APIRouter()

# Calculate total marks and percentage for an exam
def calculate_exam_stats(subjects_marks):
    total_marks = sum(subjects_marks.values())
    max_possible = len(subjects_marks) * 100  # Assuming each subject has a max of 100 marks
    percentage = (total_marks / max_possible) * 100 if max_possible > 0 else 0
    return total_marks, percentage

# Helper function to convert ObjectId to string
def convert_objectid(item):
    if isinstance(item, dict) and "_id" in item:
        item["id"] = str(item.pop("_id"))
    return item

# Get subjects for a specific group
@router.get("/subjects/{group}", response_model=GroupSubjects)
async def get_subjects_for_group(
    group: str,
    current_user = Depends(get_current_active_staff)
):
    """Get all subjects for a specific group"""
    subjects = SubjectsByGroup.get_subjects_for_group(group)
    
    if not subjects:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No subjects found for group {group}"
        )
    
    return {
        "group": group,
        "subjects": subjects
    }

# Get all exams with filtering options
@router.get("/", response_model=List[ExamResponse])
async def get_all_exams(
    current_user = Depends(get_current_active_staff),
    student_id: Optional[str] = None,
    admission_number: Optional[str] = None,
    year: Optional[int] = None,
    group: Optional[str] = None,
    exam_type: Optional[ExamType] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get all exams with optional filtering - Accessible by staff and principal"""
    query = {}
    
    # Apply filters if provided
    if student_id:
        query["student_id"] = student_id
    if admission_number:
        query["admission_number"] = admission_number
    if year is not None:
        query["year"] = year
    if group:
        query["group"] = group
    if exam_type:
        query["exam_type"] = exam_type
    
    exams = []
    cursor = exams_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    
    for exam in cursor:
        exam = convert_objectid(exam)
        exams.append(exam)
    
    return exams

# Get a specific exam by ID
@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: str,
    current_user = Depends(get_current_active_staff)
):
    """Get a specific exam by ID - Accessible by staff and principal"""
    exam = exams_collection.find_one({"_id": ObjectId(exam_id)})
    
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam record not found"
        )
    
    exam = convert_objectid(exam)
    return exam

# Get all exams for a specific student
@router.get("/student/{student_id}", response_model=StudentExamsSummary)
async def get_student_exams(
    student_id: str,
    current_user = Depends(get_current_active_staff)
):
    """Get all exams for a specific student - Accessible by staff and principal"""
    student = students_collection.find_one({"_id": ObjectId(student_id)})
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    exams = []
    cursor = exams_collection.find({"student_id": student_id}).sort("created_at", -1)
    
    for exam in cursor:
        exam = convert_objectid(exam)
        exams.append(exam)
    
    return {
        "student_id": student_id,
        "student_name": student["name"],
        "admission_number": student["admission_number"],
        "group": student["group"],
        "exams": exams
    }

# Create a new exam record
@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam: ExamCreate,
    current_user = Depends(get_current_active_staff)
):
    """Create a new exam record - Accessible by staff and principal"""
    # Verify student exists
    student = students_collection.find_one({"_id": ObjectId(exam.student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check if an exam of this type already exists for this student
    existing_exam = exams_collection.find_one({
        "student_id": exam.student_id,
        "exam_type": exam.exam_type
    })
    
    if existing_exam:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Exam record for {exam.exam_type} already exists for this student"
        )
    
    # Calculate total marks and percentage
    total_marks, percentage = calculate_exam_stats(exam.subjects)
    
    # Prepare exam data
    exam_data = exam.dict()
    exam_data["total_marks"] = total_marks
    exam_data["percentage"] = percentage
    exam_data["created_at"] = datetime.now()
    
    # Insert into database
    result = exams_collection.insert_one(exam_data)
    
    # Get and return the created exam
    created_exam = exams_collection.find_one({"_id": result.inserted_id})
    created_exam = convert_objectid(created_exam)
    
    return created_exam

# Update an exam record
@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: str,
    exam_update: ExamUpdate,
    current_user = Depends(get_current_active_staff)
):
    """Update an exam record - Accessible by staff and principal"""
    # Check if exam exists
    exam = exams_collection.find_one({"_id": ObjectId(exam_id)})
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam record not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in exam_update.dict().items() if v is not None}
    
    # If updating subjects, recalculate total marks and percentage
    if "subjects" in update_data:
        total_marks, percentage = calculate_exam_stats(update_data["subjects"])
        update_data["total_marks"] = total_marks
        update_data["percentage"] = percentage
    
    update_data["updated_at"] = datetime.now()
    
    # Update exam
    exams_collection.update_one(
        {"_id": ObjectId(exam_id)},
        {"$set": update_data}
    )
    
    # Get and return the updated exam
    updated_exam = exams_collection.find_one({"_id": ObjectId(exam_id)})
    updated_exam = convert_objectid(updated_exam)
    
    return updated_exam

# Delete an exam record
@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: str,
    current_user = Depends(get_current_active_principal)  # Only principals can delete
):
    """Delete an exam record - Accessible by principals only"""
    # Check if exam exists
    exam = exams_collection.find_one({"_id": ObjectId(exam_id)})
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam record not found"
        )
    
    # Delete exam
    result = exams_collection.delete_one({"_id": ObjectId(exam_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete exam record"
        )
    
    return None

# Get exams for multiple students at once (batch)
@router.post("/batch", response_model=Dict[str, StudentExamsSummary])
async def get_batch_student_exams(
    student_ids: List[str],
    current_user = Depends(get_current_active_staff)
):
    """Get exams for multiple students in a single request - Accessible by staff and principal"""
    if not student_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No student IDs provided"
        )
    
    # Convert string IDs to ObjectId
    object_ids = [ObjectId(student_id) for student_id in student_ids]
    
    # Get all students in a single query
    students = {str(student["_id"]): student for student in students_collection.find({"_id": {"$in": object_ids}})}
    
    if not students:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No students found with the provided IDs"
        )
    
    # Get all exams for these students in a single query
    all_exams = list(exams_collection.find({"student_id": {"$in": student_ids}}).sort("created_at", -1))
    
    # Organize exams by student ID
    result = {}
    for student_id in student_ids:
        # Skip if student not found
        if student_id not in students:
            continue
            
        student = students[student_id]
        
        # Filter exams for this student
        student_exams = [convert_objectid(exam) for exam in all_exams if exam["student_id"] == student_id]
        
        # Add to result
        result[student_id] = {
            "student_id": student_id,
            "student_name": student["name"],
            "admission_number": student["admission_number"],
            "group": student["group"],
            "exams": student_exams
        }
    
    return result 