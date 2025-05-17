from enum import Enum
from datetime import datetime
from bson import ObjectId

# User role enumeration
class UserRole(str, Enum):
    STUDENT = "student"
    STAFF = "staff"
    PRINCIPAL = "principal"

# Helper class to convert MongoDB ObjectId to string
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string") 