from datetime import datetime

from pydantic import BaseModel, Field


class User(BaseModel):
    email: str
    password_hash: str | None
    name: str
    created_at: datetime
    bio: str = ""
    skills: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    location: str = ""
    preferred_difficulty: str = "medium"
    preferred_question_types: list[str] = Field(default_factory=lambda: ["written"])
    preferred_topics: str = ""
