from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import routes as auth_routes
from app.routes.users import routes as users_routes
from app.routes.announcements import routes as announcements_routes
from app.routes.faculty import routes as faculty_routes
from app.routes.dashboards import routes as dashboard_routes
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

@app.get("/")
async def root():
    return {"message": "Welcome to GJC Vemulawada API"} 