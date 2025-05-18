from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from app.models.student import Gender, Medium, Group

class StudentBase(BaseModel):
    admission_number: str
    year: int
    group: Group
    medium: Medium
    name: str
    father_name: str
    date_of_birth: date
    caste: str
    gender: Gender
    aadhar_number: str
    student_phone: Optional[str] = None
    parent_phone: str

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    admission_number: Optional[str] = None
    year: Optional[int] = None
    group: Optional[Group] = None
    medium: Optional[Medium] = None
    name: Optional[str] = None
    father_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    caste: Optional[str] = None
    gender: Optional[Gender] = None
    aadhar_number: Optional[str] = None
    student_phone: Optional[str] = None
    parent_phone: Optional[str] = None

class StudentResponse(StudentBase):
    id: str
    created_at: date
    updated_at: Optional[date] = None

    class Config:
        orm_mode = True 