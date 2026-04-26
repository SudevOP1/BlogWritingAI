from pydantic import BaseModel, Field
from typing import List, Annotated, Optional
import operator


class Task(BaseModel):
    id: int
    title: str
    brief: str = Field(..., description="What to cover")


class Plan(BaseModel):
    blog_title: str
    tasks: List[Task]


class State(BaseModel):
    topic: str
    plan: Optional[Plan] = None
    sections: Annotated[List[str], operator.add] = []
    final: Optional[str] = None
    save_to_path: Optional[str] = None
