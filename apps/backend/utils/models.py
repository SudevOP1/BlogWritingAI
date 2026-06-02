from pydantic import BaseModel
from typing import Optional, List


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    display_name: str
    username: str
    password: str


class BlogStatusUpdate(BaseModel):
    status: str


class CommentRequest(BaseModel):
    parent_id: Optional[str] = None
    content: str


class BookmarkResponse(BaseModel):
    success: bool
    bookmarks: List[str]
