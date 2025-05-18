from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from typing import Optional
from app.schemas.user import UserCreate, Token, UserResponse
from app.models.user import UserRole
from app.services.auth import authenticate_user, get_password_hash, create_access_token, get_current_user
from app.db.mongodb import users_collection
from config.settings import ACCESS_TOKEN_EXPIRE_DELTA
from jose import jwt, JWTError
from config.settings import SECRET_KEY, ALGORITHM

router = APIRouter()

# Registration is disabled
# @router.post("/register", status_code=status.HTTP_201_CREATED)
# async def register_user(user: UserCreate):
#     # Check if username already exists
#     if users_collection.find_one({"username": user.username}):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Username already exists"
#         )
#     
#     # Check if email already exists
#     if users_collection.find_one({"email": user.email}):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Email already in use"
#         )
#     
#     # Create new user
#     user_data = {
#         "username": user.username,
#         "email": user.email,
#         "hashed_password": get_password_hash(user.password),
#         "role": user.role,
#         "created_at": datetime.utcnow()
#     }
#     
#     result = users_collection.insert_one(user_data)
#     
#     return {"message": "User created successfully", "id": str(result.inserted_id)}

# Disabled registration - return error
@router.post("/register", status_code=status.HTTP_403_FORBIDDEN)
async def register_user_disabled(user: UserCreate):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Registration is currently disabled. Please contact an administrator."
    )

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    authorization: Optional[str] = Header(None)
):
    # Check if user is already logged in by validating the token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        try:
            # Check if token is valid
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if username:
                # If token is valid, user is already logged in
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already logged in. Please log out first."
                )
        except JWTError:
            # If token is invalid, continue with login process
            pass
    
    # Continue with the normal login process
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