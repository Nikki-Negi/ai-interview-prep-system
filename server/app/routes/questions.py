from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_service import generate_questions

questions_router = APIRouter()


class QuestionRequest(BaseModel):
    category: str
    difficulty: str = "medium"
    question_type: str = "written"
    num_questions: int = 5


@questions_router.post("/questions/generate")
def generate_questions_route(payload: QuestionRequest):
    questions = generate_questions(
        payload.category,
        payload.difficulty,
        payload.question_type,
        payload.num_questions,
    )
    return {"questions": questions}
