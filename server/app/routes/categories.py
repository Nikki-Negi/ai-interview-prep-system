from fastapi import APIRouter

categories_router = APIRouter()


@categories_router.get("/categories")
def get_categories():
    return [
        {
            "id": "software-engineering",
            "name": "Software Engineering",
            "description": "Practice coding interviews, system design, and technical problem-solving.",
        },
        {
            "id": "data-science",
            "name": "Data Science",
            "description": "Prepare for analytics, machine learning, and data-focused interview questions.",
        },
        {
            "id": "hr-behavioral",
            "name": "HR / Behavioral",
            "description": "Sharpen your storytelling and answers to common behavioral interview prompts.",
        },
        {
            "id": "product-management",
            "name": "Product Management",
            "description": "Build confidence for product thinking, prioritization, and strategy questions.",
        },
        {
            "id": "marketing",
            "name": "Marketing",
            "description": "Review campaign strategy, brand thinking, and growth-focused interview topics.",
        },
        {
            "id": "cybersecurity",
            "name": "Cybersecurity",
            "description": "Prepare for security-focused interview questions on threats, defense, and best practices.",
        },
        {
            "id": "python-programming",
            "name": "Python Programming",
            "description": "Practice Python concepts, coding fundamentals, and practical problem-solving.",
        },
        {
            "id": "finance-stocks",
            "name": "Finance & Stocks",
            "description": "Review financial concepts, market understanding, and stock-related interview topics.",
        },
        {
            "id": "history",
            "name": "History",
            "description": "Explore major historical events, themes, and analytical discussion prompts.",
        },
        {
            "id": "music",
            "name": "Music",
            "description": "Practice questions about musical knowledge, creativity, and industry awareness.",
        },
        {
            "id": "general-knowledge",
            "name": "General Knowledge",
            "description": "Cover broad topics and common trivia-style questions across many subjects.",
        },
    ]
