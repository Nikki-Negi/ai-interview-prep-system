from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from app.routes.admin import admin_router
from app.routes.answers import answers_router
from app.routes.auth import auth_router, limiter
from app.routes.categories import categories_router
from app.routes.history import history_router
from app.routes.profile import profile_router
from app.routes.questions import questions_router
from app.services.database import ping_database

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(HTTPException)
async def sanitized_http_exception_handler(request: Request, exc: HTTPException):
    print(f"HTTP EXCEPTION: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": "Something went wrong"},
    )


@app.exception_handler(RequestValidationError)
async def sanitized_validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    print(f"VALIDATION ERROR: {exc}")
    error_locations = [tuple(error.get("loc", ())) for error in exc.errors()]

    if any("password" in location for location in error_locations):
        return JSONResponse(
            status_code=400,
            content={"detail": "Password must be at least 8 characters"},
        )

    return JSONResponse(
        status_code=400,
        content={"detail": "Something went wrong"},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/")
def root():
    return {"message": "AI Interview Prep API is running"}


@app.on_event("startup")
async def startup_event():
    try:
        await ping_database()
        print("Connected to MongoDB Atlas successfully")
    except Exception as error:
        print(error)


@app.get("/health/db")
async def health_db():
    try:
        await ping_database()
        return {"database": "connected"}
    except Exception as error:
        print(error)
        return {"database": "error", "detail": "Something went wrong"}


app.include_router(auth_router, prefix="/auth")
app.include_router(answers_router)
app.include_router(categories_router)
app.include_router(history_router)
app.include_router(profile_router)
app.include_router(admin_router)
app.include_router(questions_router)
