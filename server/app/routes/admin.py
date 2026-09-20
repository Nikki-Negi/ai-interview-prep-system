import os

from fastapi import APIRouter, Depends, HTTPException, status

from app.routes.auth import require_admin
from app.services.database import interviews_collection, users_collection

admin_router = APIRouter()
admin_email = os.getenv("ADMIN_EMAIL", "")


def normalize_email(email: str) -> str:
    return (email or "").lower().strip()


def _average_score(qa_results):
    scores = [float(item.get("score", 0)) for item in qa_results if isinstance(item, dict)]
    return sum(scores) / len(scores) if scores else 0.0


@admin_router.get("/admin/check/{user_email}")
async def check_admin(user_email: str):
    return {"is_admin": normalize_email(user_email) == normalize_email(admin_email)}


@admin_router.get("/admin/all-interviews", dependencies=[Depends(require_admin)])
async def all_interviews():
    if interviews_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database is not configured",
        )

    cursor = interviews_collection.find({}).sort("completed_at", -1)
    records = await cursor.to_list(length=None)

    return [
        {
            "id": str(record["_id"]),
            "category": record.get("category", ""),
            "user_email": record.get("user_email", ""),
            "average_score": _average_score(record.get("qa_results", [])),
            "completed_at": record.get("completed_at"),
        }
        for record in records
    ]


@admin_router.get("/admin/all-users", dependencies=[Depends(require_admin)])
async def all_users():
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database is not configured",
        )

    cursor = users_collection.find({}, {"name": 1, "email": 1, "created_at": 1})
    records = await cursor.to_list(length=None)

    return [
        {
            "name": record.get("name", ""),
            "email": record.get("email", ""),
            "created_at": record.get("created_at"),
        }
        for record in records
    ]


@admin_router.delete("/admin/users/{user_email}", dependencies=[Depends(require_admin)])
async def delete_user(user_email: str):
    if users_collection is None or interviews_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database is not configured",
        )

    normalized_email = normalize_email(user_email)
    user_result = await users_collection.delete_one({"email": normalized_email})

    if user_result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    await interviews_collection.delete_many({"user_email": normalized_email})

    return {"message": "User deleted"}
