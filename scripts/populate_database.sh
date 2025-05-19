#!/bin/bash

set -e  # Exit on error

# Default values
API_URL="http://localhost:8000"
STUDENT_COUNT=150
ACADEMIC_YEAR="2024-2025"
DRY_RUN=false
MONTHS=("january" "february" "march" "april" "may" "june" "july" "august" "september" "october" "november" "december")
AUTH_TOKEN=""

# Working days per month (approximate) - simple variables instead of associative array
WD_JANUARY=25
WD_FEBRUARY=22
WD_MARCH=26
WD_APRIL=24
WD_MAY=25
WD_JUNE=24
WD_JULY=26
WD_AUGUST=27
WD_SEPTEMBER=24
WD_OCTOBER=26
WD_NOVEMBER=24
WD_DECEMBER=22

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --api-url)
      API_URL="$2"
      shift
      shift
      ;;
    --count)
      STUDENT_COUNT="$2"
      shift
      shift
      ;;
    --academic-year)
      ACADEMIC_YEAR="$2"
      shift
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --auth-token)
      AUTH_TOKEN="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Function to get working days for a month
get_working_days() {
  local month=$1
  case $month in
    january)
      echo $WD_JANUARY
      ;;
    february)
      echo $WD_FEBRUARY
      ;;
    march)
      echo $WD_MARCH
      ;;
    april)
      echo $WD_APRIL
      ;;
    may)
      echo $WD_MAY
      ;;
    june)
      echo $WD_JUNE
      ;;
    july)
      echo $WD_JULY
      ;;
    august)
      echo $WD_AUGUST
      ;;
    september)
      echo $WD_SEPTEMBER
      ;;
    october)
      echo $WD_OCTOBER
      ;;
    november)
      echo $WD_NOVEMBER
      ;;
    december)
      echo $WD_DECEMBER
      ;;
  esac
}

echo "=========================================================="
echo "  GJC Vemulawada Database Population Script"
echo "=========================================================="
echo "API URL: $API_URL"
echo "Student Count: $STUDENT_COUNT"
echo "Academic Year: $ACADEMIC_YEAR"
if [ "$DRY_RUN" = true ]; then
  echo "Mode: DRY RUN (no data will be saved)"
else
  echo "Mode: LIVE (data will be saved to database)"
fi
echo ""

# Make scripts executable
chmod +x scripts/generate_students.py
chmod +x scripts/generate_attendance.py

# Build the base command with common parameters
AUTH_PARAM=""
if [ -n "$AUTH_TOKEN" ]; then
  AUTH_PARAM="--auth-token $AUTH_TOKEN"
fi

DRY_RUN_PARAM=""
if [ "$DRY_RUN" = true ]; then
  DRY_RUN_PARAM="--dry-run"
fi

BASE_PARAMS="--api-url $API_URL $AUTH_PARAM $DRY_RUN_PARAM"

echo "Step 1: Creating $STUDENT_COUNT students..."
echo "=========================================================="
python scripts/generate_students.py --count $STUDENT_COUNT $BASE_PARAMS

if [ "$DRY_RUN" = false ]; then
  echo ""
  echo "Step 2: Creating attendance records for each month..."
  echo "=========================================================="

  for month in "${MONTHS[@]}"; do
    working_days=$(get_working_days $month)
    echo ""
    echo "Generating attendance for $month ($working_days working days)..."
    echo "----------------------------------------------------------"
    python scripts/generate_attendance.py \
      --academic-year $ACADEMIC_YEAR \
      --month $month \
      --working-days $working_days \
      $BASE_PARAMS
  done
else
  echo ""
  echo "Skipping attendance generation in dry run mode."
fi

echo ""
echo "Database population completed!"
if [ "$DRY_RUN" = true ]; then
  echo "This was a dry run. Run without --dry-run to save data to the database."
fi 