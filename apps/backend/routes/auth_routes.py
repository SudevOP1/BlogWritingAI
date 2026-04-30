from fastapi import APIRouter, HTTPException

from utils.db import db
from utils.auth import verify_password, create_access_token, create_user
from utils.models import LoginRequest, SignupRequest

auth_router = APIRouter()


@auth_router.post("/signup")
async def signup(body: SignupRequest):

    existing_user = await db.users.find_one({"username": body.username})

    if existing_user:
        raise HTTPException(status_code=409, detail="user already exists")

    user = await create_user(username=body.username, password=body.password)

    return {
        "success": True,
        "user": {
            "username": user.get("username"),
            "id": str(user.get("_id")),
            "created_at": user.get("created_at").isoformat(),
        },
    }


@auth_router.post("/login")
async def login(body: LoginRequest):

    user = await db.users.find_one({"username": body.username})

    if not user or not verify_password(body.password, user.get("password")):
        raise HTTPException(status_code=401, detail="invalid credentials")

    access_token = create_access_token(data={"username": user.get("username")})

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
    }
