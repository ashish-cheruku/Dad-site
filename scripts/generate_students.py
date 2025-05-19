import requests
import random
import json
from datetime import datetime, timedelta
import argparse

# Configure the script with command-line arguments
parser = argparse.ArgumentParser(description='Generate students for the GJC Vemulawada system')
parser.add_argument('--count', type=int, default=150, help='Number of students to generate')
parser.add_argument('--api-url', type=str, default='http://localhost:8000', help='Base URL for the API')
parser.add_argument('--auth-token', type=str, help='Authentication token (if needed)')
parser.add_argument('--dry-run', action='store_true', help='Generate data without sending to API')
args = parser.parse_args()

# Configuration
API_BASE_URL = args.api_url
STUDENT_ENDPOINT = f"{API_BASE_URL}/students"
NUM_STUDENTS = args.count
AUTH_TOKEN = args.auth_token
DRY_RUN = args.dry_run

# Lists for generating random data
first_names = [
    "Aakash", "Aanya", "Aarav", "Aditi", "Advait", "Akshay", "Amrita", "Ananya", "Aniket", "Anjali",
    "Arjun", "Aryan", "Ayesha", "Bhavya", "Chetan", "Darshan", "Deepa", "Deepak", "Divya", "Farhan",
    "Garima", "Gaurav", "Geeta", "Gopal", "Harish", "Ishaan", "Jaya", "Jayesh", "Kabir", "Kavya",
    "Kishore", "Kriti", "Kumar", "Lakshmi", "Madhav", "Manish", "Maya", "Mohit", "Nandini", "Naveen",
    "Neha", "Nikhil", "Nisha", "Omkar", "Pallavi", "Pankaj", "Pooja", "Prakash", "Priya", "Rahul",
    "Raj", "Rajesh", "Ranjit", "Rashmi", "Ravi", "Rekha", "Rohit", "Roshan", "Samir", "Sandeep",
    "Sanjay", "Sapna", "Sarika", "Shivani", "Shreya", "Shweta", "Siddharth", "Simran", "Sneha", "Sunil",
    "Sushil", "Swati", "Tanvi", "Tarun", "Uday", "Uma", "Varun", "Vidya", "Vijay", "Vimal"
]

last_names = [
    "Acharya", "Agarwal", "Arora", "Bhat", "Choudhury", "Dasgupta", "Deshmukh", "Devi", "Goel", "Gupta",
    "Hegde", "Iyer", "Jain", "Jha", "Joshi", "Kapoor", "Khan", "Kumar", "Mahajan", "Malhotra",
    "Mehta", "Menon", "Mishra", "Mukherjee", "Nair", "Naidu", "Nayak", "Patel", "Pillai", "Prasad",
    "Rao", "Reddy", "Saxena", "Sharma", "Shinde", "Singh", "Srinivasan", "Subramanian", "Thakur", "Verma",
    "Achari", "Anand", "Banerjee", "Chatterjee", "Datta", "Gandhi", "Iyengar", "Krishnan", "Lal", "Modi",
    "Nambiar", "Pandey", "Rajan", "Swamy", "Tiwari", "Varma", "Wadhwa", "Yadav", "Bhatt", "Chopra"
]

father_names = [
    "Adarsh", "Ajay", "Anil", "Ashok", "Balaji", "Bhanu", "Bhaskar", "Chandra", "Damodar", "Dinesh",
    "Ganesh", "Girish", "Govind", "Harish", "Jagdish", "Kiran", "Krishna", "Mahesh", "Mohan", "Naresh",
    "Prakash", "Prem", "Rajesh", "Ramesh", "Satish", "Shyam", "Srinivas", "Suresh", "Venkat", "Vijay"
]

castes = [
    "OC", "SC", "ST", "BC-A", "BC-B", "BC-C", "BC-D", "BC-E", "EWS", "Minority"
]

groups = [
    "mpc", "bipc", "cec", "hec", "thm", "oas", "mphw"
]

group_distribution = {
    "mpc": 30,    # 30% MPC
    "bipc": 30,   # 30% BiPC
    "cec": 15,    # 15% CEC
    "hec": 10,    # 10% HEC
    "thm": 5,     # 5% T&HM
    "oas": 5,     # 5% OAS
    "mphw": 5     # 5% MPHW
}

medium_distribution = {
    "english": 70,  # 70% English medium
    "telugu": 30    # 30% Telugu medium
}

def generate_phone_number():
    """Generate a random 10-digit Indian mobile number"""
    return "9" + str(random.randint(100000000, 999999999))

def generate_aadhar_number():
    """Generate a random 12-digit Aadhar number"""
    return str(random.randint(100000000000, 999999999999))

def generate_dob():
    """Generate a random date of birth for students (16-19 years old)"""
    today = datetime.now()
    # First-year students are typically 16-19 years old
    max_age = 19
    min_age = 16
    
    # Calculate date range
    max_days = int((max_age * 365.25))
    min_days = int((min_age * 365.25))
    
    # Generate random days in range
    random_days = random.randint(min_days, max_days)
    
    # Calculate date
    dob = today - timedelta(days=random_days)
    
    # Format date for API (YYYY-MM-DD)
    return dob.strftime('%Y-%m-%d')

def generate_admission_number(start_num=10001):
    """Generate a sequential admission number"""
    return f"{start_num + student_index}"

def select_group_by_distribution():
    """Select a group based on the distribution percentages"""
    r = random.uniform(0, 100)
    cumulative = 0
    for group, percentage in group_distribution.items():
        cumulative += percentage
        if r <= cumulative:
            return group
    return "mpc"  # Default if something goes wrong

def select_medium_by_distribution():
    """Select a medium based on the distribution percentages"""
    r = random.uniform(0, 100)
    if r <= medium_distribution["english"]:
        return "english"
    else:
        return "telugu"

def generate_student():
    """Generate a random student"""
    first_name = random.choice(first_names)
    last_name = random.choice(last_names)
    name = f"{first_name} {last_name}"
    
    father_name = f"{random.choice(father_names)} {last_name}"
    
    group = select_group_by_distribution()
    medium = select_medium_by_distribution()
    
    gender = random.choice(["male", "female"])
    
    student = {
        "admission_number": generate_admission_number(),
        "name": name,
        "father_name": father_name,
        "date_of_birth": generate_dob(),
        "caste": random.choice(castes),
        "gender": gender,
        "aadhar_number": generate_aadhar_number(),
        "year": 1,  # All are first-year students
        "group": group,
        "medium": medium,
        "student_phone": generate_phone_number(),
        "parent_phone": generate_phone_number()
    }
    
    return student

def post_student(student_data):
    """Send the student data to the API"""
    headers = {
        "Content-Type": "application/json"
    }
    
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    try:
        response = requests.post(STUDENT_ENDPOINT, json=student_data, headers=headers)
        if response.status_code in [200, 201]:
            print(f"✓ Student {student_data['name']} (ID: {student_data['admission_number']}) created successfully")
            return True
        else:
            print(f"✗ Failed to create student {student_data['name']}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error creating student {student_data['name']}: {str(e)}")
        return False

if __name__ == "__main__":
    print(f"Generating {NUM_STUDENTS} students for GJC Vemulawada...")
    
    students_created = 0
    students_failed = 0
    
    # Track students by group and medium for reporting
    group_counts = {group: 0 for group in groups}
    medium_counts = {"english": 0, "telugu": 0}
    
    for student_index in range(NUM_STUDENTS):
        student = generate_student()
        
        # Update counts for reporting
        group_counts[student["group"]] += 1
        medium_counts[student["medium"]] += 1
        
        if DRY_RUN:
            print(f"[DRY RUN] Would create: {student['name']} - {student['group']} - {student['medium']}")
            students_created += 1
        else:
            success = post_student(student)
            if success:
                students_created += 1
            else:
                students_failed += 1
    
    # Print summary
    print("\n===== SUMMARY =====")
    print(f"Total students generated: {NUM_STUDENTS}")
    if not DRY_RUN:
        print(f"Successfully created: {students_created}")
        print(f"Failed: {students_failed}")
    
    print("\nDistribution by Group:")
    for group, count in group_counts.items():
        print(f"  {group.upper()}: {count} ({(count/NUM_STUDENTS)*100:.1f}%)")
    
    print("\nDistribution by Medium:")
    for medium, count in medium_counts.items():
        print(f"  {medium.capitalize()}: {count} ({(count/NUM_STUDENTS)*100:.1f}%)")
    
    if DRY_RUN:
        print("\nThis was a dry run. No data was sent to the API.")
        print("To create students, run without the --dry-run flag.") 