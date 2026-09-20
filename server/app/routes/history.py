import os

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.routes.auth import get_current_user, normalize_email
from app.services.database import interviews_collection

history_router = APIRouter()
admin_email = normalize_email(os.getenv("ADMIN_EMAIL", ""))


def _average_score(qa_results):
    scores = [float(item.get("score", 0)) for item in qa_results if isinstance(item, dict)]
    return sum(scores) / len(scores) if scores else 0.0


def _record_average_score(record):
    if "average_score" in record and record.get("average_score") is not None:
        return float(record.get("average_score", 0))

    return _average_score(record.get("qa_results", []))


@history_router.get("/history/{user_email}")
async def get_history(
    user_email: str,
    current_user_email: str = Depends(get_current_user),
):
    if interviews_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database is not configured",
        )

    normalized_email = normalize_email(user_email)
    current_email = normalize_email(current_user_email)
    if normalized_email != current_email and current_email != admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    cursor = interviews_collection.find({"user_email": normalized_email}).sort(
        "completed_at", -1
    )
    records = await cursor.to_list(length=None)

    return [
        {
            "id": str(record["_id"]),
            "category": record.get("category", ""),
            "overall_summary": record.get("overall_summary", ""),
            "average_score": _average_score(record.get("qa_results", [])),
            "completed_at": record.get("completed_at"),
        }
        for record in records
    ]


@history_router.get("/history/{user_email}/stats")
async def get_history_stats(
    user_email: str,
    current_user_email: str = Depends(get_current_user),
):
    if interviews_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database is not configured",
        )

    normalized_email = normalize_email(user_email)
    current_email = normalize_email(current_user_email)
    if normalized_email != current_email and current_email != admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    cursor = interviews_collection.find({"user_email": normalized_email}).sort(
        "completed_at", -1
    )
    records = await cursor.to_list(length=None)

    if not records:
        return {
            "total_interviews": 0,
            "questions_attempted": 0,
            "average_score": 0,
            "best_score": 0,
            "category_breakdown": [],
            "score_trend": [],
        }

    scored_records = [
        {
            "category": record.get("category", ""),
            "completed_at": record.get("completed_at"),
            "score": _record_average_score(record),
        }
        for record in records
    ]
    scores = [record["score"] for record in scored_records]
    questions_attempted = sum(
        len(record.get("qa_results", []))
        for record in records
        if isinstance(record.get("qa_results", []), list)
    )

    category_scores = {}
    for record in scored_records:
        category = record["category"]
        category_scores.setdefault(category, []).append(record["score"])

    latest_trend_records = list(reversed(scored_records[:10]))

    return {
        "total_interviews": len(scored_records),
        "questions_attempted": questions_attempted,
        "average_score": round(sum(scores) / len(scores), 1),
        "best_score": max(scores),
        "category_breakdown": [
            {
                "category": category,
                "average_score": round(sum(category_values) / len(category_values), 1),
            }
            for category, category_values in category_scores.items()
        ],
        "score_trend": [
            {
                "date": record["completed_at"],
                "score": record["score"],
            }
            for record in latest_trend_records
        ],
    }


@history_router.get("/history/{user_email}/{record_id}")
async def get_history_record(
    user_email: str,
    record_id: str,
    current_user_email: str = Depends(get_current_user),
):
    if interviews_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database is not configured",
        )

    try:
        object_id = ObjectId(record_id)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid record id",
        ) from error

    normalized_email = normalize_email(user_email)
    current_email = normalize_email(current_user_email)
    if normalized_email != current_email and current_email != admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    record = await interviews_collection.find_one(
        {"_id": object_id, "user_email": normalized_email}
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview record not found",
        )

    record["id"] = str(record["_id"])
    record.pop("_id", None)
    return record
