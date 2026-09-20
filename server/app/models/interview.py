from datetime import datetime

from pydantic import BaseModel


class QAResult(BaseModel):
    question: str
    answer: str
    score: float
    strengths: str
    improvement: str


class InterviewRecord(BaseModel):
    user_email: str
    category: str
    qa_results: list[QAResult]
    overall_summary: str
    completed_at: datetime
