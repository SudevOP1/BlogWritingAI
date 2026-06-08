from pydantic import BaseModel, Field, BeforeValidator
from typing import Annotated, Optional
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]


class BlogModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    author_id: Optional[PyObjectId] = None
    ip_address: Optional[str] = None
    topic: str
    title: str = ""
    content: str = ""
    status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class CommentModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    blog_id: PyObjectId
    user_id: PyObjectId
    parent_id: Optional[PyObjectId] = None
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LikeModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    blog_id: PyObjectId
    user_id: PyObjectId


class FollowModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    follower_id: PyObjectId
    following_id: PyObjectId
