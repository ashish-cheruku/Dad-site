from enum import Enum
from datetime import date

class Month(str, Enum):
    JANUARY = "january"
    FEBRUARY = "february"
    MARCH = "march"
    APRIL = "april"
    MAY = "may"
    JUNE = "june"
    JULY = "july"
    AUGUST = "august"
    SEPTEMBER = "september"
    OCTOBER = "october"
    NOVEMBER = "november"
    DECEMBER = "december"

class AttendanceModel:
    student_id: str  # Reference to the student
    academic_year: str  # e.g., "2023-2024"
    month: Month
    working_days: int  # Set by principal
    days_present: int  # Set by staff
    attendance_percentage: float  # Calculated from days_present/working_days
    last_updated: date
    updated_by: str  # Reference to the staff/principal who updated 