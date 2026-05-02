from fastapi import Security, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from datetime import datetime, timedelta
from typing import Optional
from passlib.hash import pbkdf2_sha256
from jose import JWTError, jwt

from utils.settings import get_settings
from utils.db import db

settings = get_settings()
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pbkdf2_sha256.hash(password + settings.JWT_SECRET)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return pbkdf2_sha256.verify(password + settings.JWT_SECRET, hashed)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> tuple[bool, dict | str]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return True, payload
    except jwt.ExpiredSignatureError:
        return False, "token expired"
    except Exception:
        return False, "invalid token"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:

    token = credentials.credentials
    payload_ok, payload = verify_token(token)

    if not payload_ok:
        raise HTTPException(status_code=401, detail=payload)

    username = payload.get("username")
    if not username:
        raise HTTPException(status_code=401, detail="invalid token")

    # verify user still exists
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="user not found")

    return {"username": username, "id": user.get("_id")}


async def create_user(username: str, password: str):
    hashed = hash_password(password)

    result = await db.users.insert_one(
        {"username": username, "password": hashed, "created_at": datetime.utcnow()}
    )

    user = await db.users.find_one({"_id": result.inserted_id})
    return user
