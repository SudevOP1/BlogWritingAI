from pydantic import BaseModel, Field, BeforeValidator
from typing import Annotated, Optional
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]


class BlogModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    author_id: Optional[PyObjectId] = None
    topic: str
    title: str = ""
    content: str = ""
    status: str = "draft"
    is_generated: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    num_likes: int = 0

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
