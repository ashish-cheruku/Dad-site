import requests
import random
import json
import argparse

# Configure the script with command-line arguments
parser = argparse.ArgumentParser(description='Generate attendance data for students in GJC Vemulawada')
parser.add_argument('--api-url', type=str, default='http://localhost:8000', help='Base URL for the API')
parser.add_argument('--academic-year', type=str, default='2024-2025', help='Academic year for attendance')
parser.add_argument('--month', type=str, default='january', help='Month for attendance data')
parser.add_argument('--auth-token', type=str, help='Authentication token (if needed)')
parser.add_argument('--dry-run', action='store_true', help='Generate data without sending to API')
parser.add_argument('--working-days', type=int, default=29, help='Number of working days in the month')
args = parser.parse_args()

# Configuration
API_BASE_URL = args.api_url
STUDENTS_ENDPOINT = f"{API_BASE_URL}/students"
ATTENDANCE_ENDPOINT = f"{API_BASE_URL}/attendance"
WORKING_DAYS_ENDPOINT = f"{API_BASE_URL}/attendance/working-days"
AUTH_TOKEN = args.auth_token
DRY_RUN = args.dry_run
ACADEMIC_YEAR = args.academic_year
MONTH = args.month
WORKING_DAYS = args.working_days

def set_working_days():
    """Set the working days for the month"""
    headers = {
        "Content-Type": "application/json"
    }
    
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    data = {
        "academic_year": ACADEMIC_YEAR,
        "month": MONTH,
        "working_days": WORKING_DAYS
    }
    
    try:
        response = requests.post(f"{WORKING_DAYS_ENDPOINT}/{MONTH}/{ACADEMIC_YEAR}", 
                                json={"working_days": WORKING_DAYS}, 
                                headers=headers)
        if response.status_code in [200, 201]:
            print(f"✓ Working days set to {WORKING_DAYS} for {MONTH.capitalize()} {ACADEMIC_YEAR}")
            return True
        else:
            print(f"✗ Failed to set working days: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error setting working days: {str(e)}")
        return False

def get_all_students():
    """Get all students from the API"""
    headers = {}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    try:
        response = requests.get(STUDENTS_ENDPOINT, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to get students: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"Error getting students: {str(e)}")
        return []

def generate_attendance_for_student(student_id):
    """Generate random attendance for a student"""
    # Generate a random number of days present (more likely to be present than absent)
    attendance_profile = random.choices(
        ["high", "medium", "low", "very_low"],
        weights=[60, 25, 10, 5],  # Most students have high attendance
        k=1
    )[0]
    
    if attendance_profile == "high":
        # 80-100% attendance
        min_percent = 80
        max_percent = 100
    elif attendance_profile == "medium":
        # 65-80% attendance
        min_percent = 65
        max_percent = 80
    elif attendance_profile == "low":
        #.45-65% attendance
        min_percent = 45
        max_percent = 65
    else:  # very_low
        # 10-45% attendance
        min_percent = 10
        max_percent = 45
    
    # Calculate days present based on percentage
    attendance_percentage = random.uniform(min_percent, max_percent)
    days_present = round((attendance_percentage / 100) * WORKING_DAYS)
    
    # Ensure days_present is within valid range
    days_present = max(0, min(days_present, WORKING_DAYS))
    
    return {
        "student_id": student_id,
        "academic_year": ACADEMIC_YEAR,
        "month": MONTH,
        "days_present": days_present,
        "attendance_profile": attendance_profile
    }

def post_attendance(attendance_data):
    """Send the attendance data to the API"""
    headers = {
        "Content-Type": "application/json"
    }
    
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    student_id = attendance_data["student_id"]
    days_present = attendance_data["days_present"]
    endpoint = f"{ATTENDANCE_ENDPOINT}/student/{student_id}/{ACADEMIC_YEAR}/{MONTH}"
    
    try:
        response = requests.put(endpoint, json={"days_present": days_present}, headers=headers)
        if response.status_code in [200, 201]:
            attendance_percentage = round((days_present / WORKING_DAYS) * 100, 1)
            print(f"✓ Attendance set for student {student_id}: {days_present}/{WORKING_DAYS} days ({attendance_percentage}%)")
            return True
        else:
            print(f"✗ Failed to set attendance for student {student_id}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error setting attendance for student {student_id}: {str(e)}")
        return False

if __name__ == "__main__":
    print(f"Generating attendance data for {MONTH.capitalize()} {ACADEMIC_YEAR}...")
    
    if not DRY_RUN:
        print("\nSetting working days for the month...")
        set_working_days()
    
    print("\nFetching students...")
    students = get_all_students()
    
    if not students:
        print("No students found. Please make sure you've created students first.")
        exit(1)
    
    print(f"Found {len(students)} students")
    
    attendance_created = 0
    attendance_failed = 0
    attendance_profiles = {"high": 0, "medium": 0, "low": 0, "very_low": 0}
    
    print("\nGenerating attendance data...")
    for student in students:
        student_id = student["id"]
        attendance = generate_attendance_for_student(student_id)
        
        # Update counts for reporting
        attendance_profiles[attendance["attendance_profile"]] += 1
        
        if DRY_RUN:
            attendance_percentage = round((attendance["days_present"] / WORKING_DAYS) * 100, 1)
            print(f"[DRY RUN] Would set attendance for student {student_id}: " +
                  f"{attendance['days_present']}/{WORKING_DAYS} days ({attendance_percentage}%)")
            attendance_created += 1
        else:
            success = post_attendance(attendance)
            if success:
                attendance_created += 1
            else:
                attendance_failed += 1
    
    # Print summary
    print("\n===== SUMMARY =====")
    print(f"Working days in {MONTH.capitalize()} {ACADEMIC_YEAR}: {WORKING_DAYS}")
    print(f"Total students: {len(students)}")
    
    if not DRY_RUN:
        print(f"Successfully updated: {attendance_created}")
        print(f"Failed: {attendance_failed}")
    
    print("\nAttendance Distribution:")
    total = sum(attendance_profiles.values())
    for profile, count in attendance_profiles.items():
        print(f"  {profile.replace('_', ' ').capitalize()}: {count} ({(count/total)*100:.1f}%)")
    
    if DRY_RUN:
        print("\nThis was a dry run. No data was sent to the API.")
        print("To update attendance, run without the --dry-run flag.") 