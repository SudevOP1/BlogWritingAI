from pydantic import BaseModel
from typing import Optional, List


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    username: str
    password: str


class BlogStatusUpdate(BaseModel):
    status: str


class CommentRequest(BaseModel):
    content: str
    parent_id: Optional[str] = None


class BookmarkResponse(BaseModel):
    success: bool
    bookmarks: List[str]
