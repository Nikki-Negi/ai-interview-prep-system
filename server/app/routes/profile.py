import os

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.routes.auth import get_current_user, normalize_email
from app.services.database import users_collection

profile_router = APIRouter()
admin_email = normalize_email(os.getenv("ADMIN_EMAIL", ""))


PROFILE_FIELDS = (
    "name",
    "email",
    "bio",
    "skills",
    "goals",
    "location",
    "preferred_difficulty",
    "preferred_question_types",
    "preferred_topics",
    "created_at",
)


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    bio: str | None = None
    skills: list[str] | None = None
    goals: list[str] | None = None
    location: str | None = None
    preferred_difficulty: str | None = None
    preferred_question_types: list[str] | None = None
    preferred_topics: str | None = None


def _profile_response(user: dict) -> dict:
    return {
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "bio": user.get("bio", ""),
        "skills": user.get("skills", []),
        "goals": user.get("goals", []),
        "location": user.get("location", ""),
        "preferred_difficulty": user.get("preferred_difficulty", "medium"),
        "preferred_question_types": user.get("preferred_question_types", ["written"]),
        "preferred_topics": user.get("preferred_topics", ""),
        "created_at": user.get("created_at"),
        "has_password": bool(user.get("password_hash")),
    }


@profile_router.get("/profile/{user_email}")
async def get_profile(
    user_email: str,
    current_user_email: str = Depends(get_current_user),
):
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong",
        )

    normalized_email = normalize_email(user_email)
    current_email = normalize_email(current_user_email)
    if normalized_email != current_email and current_email != admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    user = await users_collection.find_one({"email": normalized_email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return _profile_response(user)


@profile_router.put("/profile")
async def update_profile(
    payload: ProfileUpdateRequest,
    current_user_email: str = Depends(get_current_user),
):
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong",
        )

    email = normalize_email(current_user_email)
    updates = payload.model_dump(exclude_unset=True)
    updates = {key: value for key, value in updates.items() if key in PROFILE_FIELDS}

    if updates:
        result = await users_collection.update_one(
            {"email": email},
            {"$set": updates},
        )
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return _profile_response(user)
