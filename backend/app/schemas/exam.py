from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from datetime import datetime
from app.models.exam import ExamType

class ExamBase(BaseModel):
    student_id: str
    student_name: str
    admission_number: str
    year: int
    group: str
    exam_type: ExamType
    subjects: Dict[str, int]  # Subject name to marks

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    subjects: Optional[Dict[str, int]] = None
    
class ExamResponse(ExamBase):
    id: str
    total_marks: int
    percentage: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class StudentExamsSummary(BaseModel):
    student_id: str
    student_name: str
    admission_number: str
    group: str
    exams: List[ExamResponse]

class GroupSubjects(BaseModel):
    group: str
    subjects: List[str] 