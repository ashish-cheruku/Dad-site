from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import routes as auth_routes
from app.routes.users import routes as users_routes
from app.routes.announcements import routes as announcements_routes
from app.routes.faculty import routes as faculty_routes
from app.routes.dashboards import routes as dashboard_routes
from app.routes.students import routes as students_routes
from app.routes.attendance import routes as attendance_routes
from app.routes.exams import routes as exams_routes
from config.settings import CORS_ORIGINS

# Initialize FastAPI app
app = FastAPI(title="GJC Vemulawada API")

# Configure CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router, tags=["Authentication"])
app.include_router(users_routes.router, prefix="/users", tags=["Users"])
app.include_router(announcements_routes.router, prefix="/announcements", tags=["Announcements"])
app.include_router(faculty_routes.router, prefix="/faculty", tags=["Faculty"])
app.include_router(dashboard_routes.router, prefix="/dashboard", tags=["Dashboards"])
# Also include dashboard routes with "principal" prefix for backward compatibility
app.include_router(dashboard_routes.router, prefix="/principal", tags=["Dashboards"])
# Also include dashboard routes with "staff" prefix
app.include_router(dashboard_routes.router, prefix="/staff", tags=["Dashboards"])
# Student management routes
app.include_router(students_routes.router, prefix="/students", tags=["Students"])
# Attendance management routes
app.include_router(attendance_routes.router, prefix="/attendance", tags=["Attendance"])
# Exam management routes
app.include_router(exams_routes.router, prefix="/exams", tags=["Exams"])

@app.get("/")
async def root():
    return {"message": "Welcome to GJC Vemulawada API"} 