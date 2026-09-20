from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_service import evaluate_answers
from app.models.interview import InterviewRecord, QAResult
from app.services.database import interviews_collection

answers_router = APIRouter()


class QAPair(BaseModel):
    question: str
    answer: str
    type: str = "written"
    options: dict[str, str] | None = None
    correct_answer: str | None = None


class AnswerEvaluationRequest(BaseModel):
    qa_pairs: list[QAPair]
    category: str
    user_email: str


@answers_router.post("/answers/evaluate")
async def evaluate_answers_route(payload: AnswerEvaluationRequest):
    evaluation = evaluate_answers(payload.qa_pairs)

    if interviews_collection is not None:
        qa_results = [
            QAResult(
                question=item["question"],
                answer=item["answer"],
                score=float(item["score"]),
                strengths=item["strengths"],
                improvement=item["improvement"],
            )
            for item in evaluation
            if isinstance(item, dict) and "question" in item
        ]
        overall_summary = next(
            (
                item["overall_summary"]
                for item in evaluation
                if isinstance(item, dict) and "overall_summary" in item
            ),
            "",
        )

        interview_record = InterviewRecord(
            user_email=payload.user_email,
            category=payload.category,
            qa_results=qa_results,
            overall_summary=overall_summary,
            completed_at=datetime.now(timezone.utc),
        )

        await interviews_collection.insert_one(interview_record.model_dump())

    return evaluation
