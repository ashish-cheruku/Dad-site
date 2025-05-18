from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from app.models.attendance import Month

class AttendanceBase(BaseModel):
    student_id: str
    academic_year: str
    month: Month

class WorkingDaysUpdate(BaseModel):
    month: Month
    academic_year: str
    working_days: int

class AttendanceUpdate(BaseModel):
    days_present: int

class AttendanceCreate(AttendanceBase):
    working_days: int = 0
    days_present: int = 0

class AttendanceResponse(AttendanceBase):
    id: str
    working_days: int
    days_present: int
    last_updated: date
    updated_by: str
    
    class Config:
        orm_mode = True

class MonthlyAttendanceSummary(BaseModel):
    student_id: str
    student_name: str
    admission_number: str
    month: Month
    academic_year: str
    working_days: int
    days_present: int
    attendance_percentage: float

class ClassAttendanceSummary(BaseModel):
    year: int
    group: str
    month: Month
    academic_year: str
    working_days: int
    students: List[MonthlyAttendanceSummary] 