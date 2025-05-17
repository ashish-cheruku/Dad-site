from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from app.schemas.user import UserCreate, Token, UserResponse
from app.models.user import UserRole
from app.services.auth import authenticate_user, get_password_hash, create_access_token, get_current_user
from app.db.mongodb import users_collection
from config.settings import ACCESS_TOKEN_EXPIRE_DELTA

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    # Check if username already exists
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )
    
    # Create new user
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": get_password_hash(user.password),
        "role": user.role,
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_data)
    
    return {"message": "User created successfully", "id": str(result.inserted_id)}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user["username"]}, 
        expires_delta=ACCESS_TOKEN_EXPIRE_DELTA
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "created_at": current_user["created_at"]
    } 