from enum import Enum
from datetime import date

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class Medium(str, Enum):
    ENGLISH = "english"
    TELUGU = "telugu"

class Group(str, Enum):
    MPC = "mpc"  # Mathematics, Physics, Chemistry
    BiPC = "bipc"  # Biology, Physics, Chemistry
    CEC = "cec"  # Commerce, Economics, Civics
    HEC = "hec"  # History, Economics, Civics
    THM = "thm"  # Tourism & Hospitality Management
    OAS = "oas"  # Office Administration & Secretaryship
    MPHW = "mphw"  # Multi-Purpose Health Worker
    OTHER = "other"

class StudentModel:
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
    student_phone: str = None
    parent_phone: str
    created_at: date
    updated_at: date = None 