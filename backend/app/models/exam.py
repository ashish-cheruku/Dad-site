from enum import Enum
from typing import Dict, List

class ExamType(str, Enum):
    UT1 = "ut1"
    UT2 = "ut2"
    UT3 = "ut3"
    UT4 = "ut4"
    HALF_YEARLY = "half-yearly"
    FINAL = "final"

class SubjectsByGroup:
    MPC = ["english", "telugu_hindi", "math_a", "math_b", "physics", "chemistry"]
    BIPC = ["english", "telugu_hindi", "botany", "zoology", "physics", "chemistry"]
    CEC = ["english", "telugu_hindi", "political_science", "economics", "commerce"]
    HEC = ["english", "telugu_hindi", "history", "economics", "commerce"]
    VOCATIONAL = ["english", "gfc", "voc1", "voc2", "voc3"]  # For T&HM, OAS, MPHW

    @staticmethod
    def get_subjects_for_group(group):
        group_upper = group.upper()
        if group_upper == "MPC":
            return SubjectsByGroup.MPC
        elif group_upper == "BIPC":
            return SubjectsByGroup.BIPC
        elif group_upper == "CEC":
            return SubjectsByGroup.CEC
        elif group_upper == "HEC":
            return SubjectsByGroup.HEC
        elif group_upper in ["THM", "OAS", "MPHW"]:
            return SubjectsByGroup.VOCATIONAL
        else:
            return []

class ExamModel:
    student_id: str
    student_name: str
    admission_number: str
    year: int
    group: str
    exam_type: ExamType
    subjects: Dict[str, int]  # Subject name to marks
    total_marks: int
    percentage: float
    created_at: str
    updated_at: str = None 