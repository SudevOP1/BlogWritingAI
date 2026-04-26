from pydantic import BaseModel, Field
from typing import Annotated, Optional, Literal
import operator


class Task(BaseModel):
    id: int
    title: str
    goal: str = Field(
        ...,
        description="One sentence describing what the reader should be able to do/understand after this section",
    )
    bullets: list[str] = Field(
        min_length=3,
        max_length=6,
        description="3-6 points summarizing what to cover in this section",
    )
    target_words: int = Field(
        ...,
        description="Number of words to aim for in this section (120-550)",
    )
    tags: list[str] = Field(default_factory=list)
    requires_research: bool = False
    requires_citations: bool = False
    requires_code: bool = False


class Plan(BaseModel):
    blog_title: str
    audience: str
    tone: str
    blog_kind: Literal[
        "explainer", "tutorial", "news_roundup", "comparison", "system_design"
    ] = "explainer"
    constraints: list[str] = Field(default_factory=list)
    tasks: list[Task]


class EvidenceItem(BaseModel):
    title: str
    url: str
    published_at: Optional[str] = None
    snippet: Optional[str] = None
    source: Optional[str] = None


class RouterDecision(BaseModel):
    needs_research: bool
    mode: Literal["closed_book", "hybrid", "open_book"]
    queries: list[str] = Field(factory_list=list)


class EvidencePack(BaseModel):
    evidence: list[EvidenceItem] = Field(factory_list=list)


class State(BaseModel):
    topic: str

    # routing / research
    mode: str = ""
    needs_research: bool = False
    queries: list[str] = []
    evidence: list[EvidenceItem] = []
    plan: Optional[Plan] = None

    # workers
    sections: Annotated[list[str], operator.add] = []
    final: str = ""

    # output
    save_to_path: Optional[str] = None
