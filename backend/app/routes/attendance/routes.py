from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
from bson import ObjectId
from app.schemas.attendance import (
    AttendanceCreate, AttendanceUpdate, AttendanceResponse,
    WorkingDaysUpdate, MonthlyAttendanceSummary, ClassAttendanceSummary
)
from app.services.auth import get_current_active_staff, get_current_active_principal, get_current_user
from app.db.mongodb import attendance_collection, students_collection
from app.models.attendance import Month

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
def convert_strings_to_dates(data, date_fields=["last_updated"]):
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

# Helper function to calculate attendance percentage
def calculate_attendance_percentage(days_present, working_days):
    """Calculate attendance percentage based on days present and working days"""
    if working_days <= 0:
        return 0.0
    return round((days_present / working_days) * 100, 2)

router = APIRouter()

# Set working days for a month (Principal only)
@router.post("/working-days", status_code=status.HTTP_200_OK)
async def set_working_days(
    data: WorkingDaysUpdate,
    current_user = Depends(get_current_active_principal)
):
    """Set working days for a specific month - Principal only"""
    try:
        # Update or create working days setting for the month
        date_now = datetime.now().date()
        
        # Create a global record to store working days for the month
        global_record = {
            "academic_year": data.academic_year,
            "month": data.month,
            "working_days": data.working_days,
            "last_updated": date_now,
            "updated_by": current_user["username"]
        }
        
        # Convert dates to strings for MongoDB
        global_record = convert_dates_to_strings(global_record)
        
        # Check if a global working days record already exists
        existing_global_record = attendance_collection.find_one({
            "academic_year": data.academic_year,
            "month": data.month,
            "student_id": {"$exists": False}  # This identifies it as a global record
        })
        
        if existing_global_record:
            # Update existing global record
            attendance_collection.update_one(
                {"_id": existing_global_record["_id"]},
                {"$set": global_record}
            )
        else:
            # Create new global record
            attendance_collection.insert_one(global_record)
        
        # Also update all existing student attendance records for this month
        # We need to update working days and recalculate attendance percentage for all student records
        student_records = attendance_collection.find({
            "academic_year": data.academic_year,
            "month": data.month,
            "student_id": {"$exists": True}  # Only update student records, not the global record
        })
        
        for record in student_records:
            days_present = record.get("days_present", 0)
            attendance_percentage = calculate_attendance_percentage(days_present, data.working_days)
            
            update_data = {
                "working_days": data.working_days,
                "attendance_percentage": attendance_percentage
            }
            
            attendance_collection.update_one(
                {"_id": record["_id"]},
                {"$set": update_data}
            )
        
        return {
            "message": f"Working days updated for {data.month} {data.academic_year}",
            "working_days": data.working_days
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error setting working days: {str(e)}"
        )

# Get working days for a month
@router.get("/working-days/{academic_year}/{month}")
async def get_working_days(
    academic_year: str,
    month: Month,
    current_user = Depends(get_current_active_staff)
):
    """Get working days for a specific month - Staff and Principal"""
    try:
        # Find global working days record for this month
        record = attendance_collection.find_one({
            "academic_year": academic_year,
            "month": month,
            "student_id": {"$exists": False}  # This identifies it as a global record
        })
        
        if not record:
            return {
                "academic_year": academic_year,
                "month": month,
                "working_days": 0
            }
        
        # Convert date strings back to date objects
        convert_strings_to_dates(record)
        
        return {
            "academic_year": academic_year,
            "month": month,
            "working_days": record.get("working_days", 0)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting working days: {str(e)}"
        )

# Update student attendance
@router.put("/student/{student_id}/{academic_year}/{month}", response_model=AttendanceResponse)
async def update_student_attendance(
    student_id: str,
    academic_year: str,
    month: Month,
    attendance: AttendanceUpdate,
    current_user = Depends(get_current_active_staff)
):
    """Update attendance for a specific student - Staff and Principal"""
    try:
        # Check if student exists
        student = students_collection.find_one({"_id": ObjectId(student_id)})
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Get current working days for this month
        working_days_record = attendance_collection.find_one({
            "academic_year": academic_year,
            "month": month,
            "student_id": {"$exists": False}  # This is a global working days record
        })
        
        working_days = working_days_record.get("working_days", 0) if working_days_record else 0
        
        # Validate days_present doesn't exceed working days
        if attendance.days_present < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Days present cannot be negative"
            )
            
        if working_days > 0 and attendance.days_present > working_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Days present ({attendance.days_present}) cannot exceed working days ({working_days})"
            )
        
        # Convert ObjectId to string for student_id if needed
        if isinstance(student_id, ObjectId):
            student_id = str(student_id)
            
        # Check if attendance record already exists
        existing_record = attendance_collection.find_one({
            "student_id": student_id,
            "academic_year": academic_year,
            "month": month
        })
        
        current_date = datetime.now().date()
        
        # Calculate attendance percentage
        attendance_percentage = calculate_attendance_percentage(attendance.days_present, working_days)
        
        if existing_record:
            # Prepare update data
            update_data = {
                "days_present": attendance.days_present,
                "attendance_percentage": attendance_percentage,
                "last_updated": current_date,
                "updated_by": current_user["username"]
            }
            # Convert dates to strings for MongoDB
            update_data = convert_dates_to_strings(update_data)
            
            # Update existing record
            update_result = attendance_collection.update_one(
                {"_id": existing_record["_id"]},
                {"$set": update_data}
            )
            
            if update_result.modified_count == 0 and update_result.matched_count == 0:
                raise Exception("Failed to update attendance record")
            
            # Get updated record
            updated_record = attendance_collection.find_one({"_id": existing_record["_id"]})
            if not updated_record:
                raise Exception("Updated record not found")
                
            updated_record["id"] = str(updated_record.pop("_id"))
            # Convert date strings back to date objects
            convert_strings_to_dates(updated_record)
            return updated_record
        else:
            # Prepare new attendance record
            new_record = {
                "student_id": student_id,
                "academic_year": academic_year,
                "month": month,
                "working_days": working_days,
                "days_present": attendance.days_present,
                "attendance_percentage": attendance_percentage,
                "last_updated": current_date,
                "updated_by": current_user["username"]
            }
            # Convert dates to strings for MongoDB
            new_record = convert_dates_to_strings(new_record)
            
            # Insert new record
            insert_result = attendance_collection.insert_one(new_record)
            if not insert_result.inserted_id:
                raise Exception("Failed to create attendance record")
                
            # Get created record
            created_record = attendance_collection.find_one({"_id": insert_result.inserted_id})
            if not created_record:
                raise Exception("Created record not found")
                
            created_record["id"] = str(created_record.pop("_id"))
            # Convert date strings back to date objects
            convert_strings_to_dates(created_record)
            return created_record
    except HTTPException:
        # Re-raise HTTP exceptions as is
        raise
    except Exception as e:
        # Log the error and return a standardized response
        error_msg = str(e)
        print(f"Error updating attendance: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating attendance: {error_msg}"
        )

# Get attendance for a specific student
@router.get("/student/{student_id}/{academic_year}/{month}", response_model=MonthlyAttendanceSummary)
async def get_student_attendance(
    student_id: str,
    academic_year: str,
    month: Month,
    current_user = Depends(get_current_active_staff)
):
    """Get attendance for a specific student - Staff and Principal"""
    # Check if student exists
    student = students_collection.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Get attendance record
    attendance_record = attendance_collection.find_one({
        "student_id": student_id,
        "academic_year": academic_year,
        "month": month
    })
    
    # If no attendance record found, return default values
    if not attendance_record:
        # Get global working days for this month
        working_days_record = attendance_collection.find_one({
            "academic_year": academic_year,
            "month": month,
            "student_id": {"$exists": False}
        })
        
        working_days = working_days_record.get("working_days", 0) if working_days_record else 0
        
        return {
            "student_id": student_id,
            "student_name": student.get("name", ""),
            "admission_number": student.get("admission_number", ""),
            "month": month,
            "academic_year": academic_year,
            "working_days": working_days,
            "days_present": 0,
            "attendance_percentage": 0.0 if working_days == 0 else 0.0
        }
    
    # Convert date strings back to date objects
    convert_strings_to_dates(attendance_record)
    
    # Calculate attendance percentage
    working_days = attendance_record.get("working_days", 0)
    days_present = attendance_record.get("days_present", 0)
    attendance_percentage = 0.0 if working_days == 0 else (days_present / working_days) * 100
    
    return {
        "student_id": student_id,
        "student_name": student.get("name", ""),
        "admission_number": student.get("admission_number", ""),
        "month": month,
        "academic_year": academic_year,
        "working_days": working_days,
        "days_present": days_present,
        "attendance_percentage": round(attendance_percentage, 2)
    }

# Get students with attendance below threshold
@router.get("/low-attendance/{academic_year}/{month}")
async def get_students_with_low_attendance(
    academic_year: str,
    month: Month,
    percentage_threshold: float = Query(..., description="Maximum attendance percentage threshold"),
    year: Optional[int] = None,
    group: Optional[str] = None,
    current_user = Depends(get_current_active_staff)
):
    """Get students with attendance percentage below the specified threshold"""
    try:
        # Build the query for students collection
        students_query = {}
        if year is not None:
            students_query["year"] = year
        if group is not None:
            students_query["group"] = group
            
        # Get the students that match the basic filters
        students = list(students_collection.find(students_query))
        
        if not students:
            return {"students": []}
            
        # Get working days for this month
        working_days_record = attendance_collection.find_one({
            "academic_year": academic_year,
            "month": month,
            "student_id": {"$exists": False}
        })
        
        if not working_days_record or working_days_record.get("working_days", 0) <= 0:
            # If no working days are set or it's zero, return empty list
            return {"students": []}
            
        working_days = working_days_record.get("working_days", 0)
        
        # Get attendance records for all students
        student_ids = [str(student["_id"]) for student in students]
        attendance_records = list(attendance_collection.find({
            "student_id": {"$in": student_ids},
            "academic_year": academic_year,
            "month": month
        }))
        
        # Create a dictionary to quickly lookup attendance by student_id
        attendance_by_student = {record["student_id"]: record for record in attendance_records}
        
        # Filter students with attendance below threshold
        low_attendance_students = []
        
        for student in students:
            student_id = str(student["_id"])
            attendance = attendance_by_student.get(student_id)
            
            # If no attendance record, add student with 0% attendance
            if not attendance:
                attendance_percentage = 0.0
                days_present = 0
            else:
                attendance_percentage = attendance.get("attendance_percentage", 0.0)
                days_present = attendance.get("days_present", 0)
                
            # Check if attendance is below the threshold
            if attendance_percentage < percentage_threshold:
                low_attendance_students.append({
                    "student_id": student_id,
                    "student_name": student.get("name", ""),
                    "admission_number": student.get("admission_number", ""),
                    "year": student.get("year", ""),
                    "group": student.get("group", ""),
                    "month": month,
                    "academic_year": academic_year,
                    "working_days": working_days,
                    "days_present": days_present,
                    "attendance_percentage": attendance_percentage
                })
                
        return {
            "academic_year": academic_year,
            "month": month,
            "percentage_threshold": percentage_threshold,
            "students": low_attendance_students
        }
                
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error finding students with low attendance: {str(e)}"
        )

# Get attendance for all students in a class
@router.get("/class/{year}/{group}/{academic_year}/{month}", response_model=ClassAttendanceSummary)
async def get_class_attendance(
    year: int,
    group: str,
    academic_year: str,
    month: Month,
    current_user = Depends(get_current_active_staff)
):
    """Get attendance for all students in a class - Staff and Principal"""
    try:
        # Get all students in this class
        students = list(students_collection.find({"year": year, "group": group}))
        
        # Get global working days for this month
        working_days_record = attendance_collection.find_one({
            "academic_year": academic_year,
            "month": month,
            "student_id": {"$exists": False}  # This identifies it as a global record
        })
        
        working_days = working_days_record.get("working_days", 0) if working_days_record else 0
        
        # Get attendance for each student
        student_attendance = []
        for student in students:
            student_id = str(student["_id"])
            
            # Get attendance record
            attendance_record = attendance_collection.find_one({
                "student_id": student_id,
                "academic_year": academic_year,
                "month": month
            })
            
            if attendance_record:
                # Convert date strings back to date objects
                convert_strings_to_dates(attendance_record)
                days_present = attendance_record.get("days_present", 0)
            else:
                days_present = 0
                
            attendance_percentage = 0.0 if working_days == 0 else (days_present / working_days) * 100
            
            student_attendance.append({
                "student_id": student_id,
                "student_name": student.get("name", ""),
                "admission_number": student.get("admission_number", ""),
                "month": month,
                "academic_year": academic_year,
                "working_days": working_days,
                "days_present": days_present,
                "attendance_percentage": round(attendance_percentage, 2)
            })
        
        return {
            "year": year,
            "group": group,
            "month": month,
            "academic_year": academic_year,
            "working_days": working_days,
            "students": student_attendance
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting class attendance: {str(e)}"
        ) 