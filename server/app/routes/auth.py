import os
from functools import partial
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from dotenv import load_dotenv
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.database import users_collection

load_dotenv()

auth_router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
MIN_PASSWORD_LENGTH = 8
PASSWORD_SPECIAL_CHARACTERS = set("!@#$%^&*()_+-=[]{}|;:,.<>?")


def format_password_requirements(requirements: list[str]) -> str:
    if len(requirements) == 1:
        requirement_text = requirements[0]
    elif len(requirements) == 2:
        requirement_text = f"{requirements[0]} and {requirements[1]}"
    else:
        requirement_text = f"{', '.join(requirements[:-1])}, and {requirements[-1]}"

    return f"Password must {requirement_text}."


def validate_request_email(value: str) -> str:
    raw_email = str(value or "").strip()
    if any("A" <= character <= "Z" for character in raw_email):
        raise ValueError("Email must not contain capital letters")

    email = raw_email.lower()
    if len(email) > 254:
        raise ValueError("Email must be 254 characters or fewer")
    local_part = email.split("@", 1)[0]
    if local_part and not ("a" <= local_part[0] <= "z"):
        raise ValueError("Email must start with a letter")
    return email


def validate_password_strength(value: str) -> str:
    password = str(value or "").strip()
    non_whitespace_password = "".join(password.split())
    missing_requirements = []

    if len(password) < MIN_PASSWORD_LENGTH:
        missing_requirements.append("be at least 8 characters")
    if len(non_whitespace_password) < MIN_PASSWORD_LENGTH:
        missing_requirements.append("not consist mainly of spaces")
    if not any(character.isdigit() for character in password):
        missing_requirements.append("include at least one number")
    if not any(character in PASSWORD_SPECIAL_CHARACTERS for character in password):
        missing_requirements.append("include at least one special character")
    if not any("A" <= character <= "Z" for character in password):
        missing_requirements.append("include at least one uppercase letter")

    if missing_requirements:
        raise ValueError(format_password_requirements(missing_requirements))

    return password


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = Field(min_length=1, max_length=100)

    @model_validator(mode="before")
    @classmethod
    def validate_raw_password_is_not_email(cls, data):
        if isinstance(data, dict):
            email = normalize_email(str(data.get("email", "")))
            name = str(data.get("name", "")).strip().lower()
            password = str(data.get("password", "")).strip().lower()
            if email and name == email:
                raise ValueError("Name must not be the same as email.")
            if email and password == email:
                raise ValueError("Password must not be the same as email.")
        return data

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return validate_request_email(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @model_validator(mode="after")
    def validate_password_is_not_email(self):
        if normalize_email(str(self.email)) == self.name.strip().lower():
            raise ValueError("Name must not be the same as email.")
        if normalize_email(str(self.email)) == self.password.strip().lower():
            raise ValueError("Password must not be the same as email.")
        return self

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value or not value.isascii() or not all(
            character.isalpha() or character.isspace() for character in value
        ):
            raise ValueError("Name must contain only letters and spaces")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return validate_request_email(value)


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=1)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_strength(value)


def create_access_token(email: str):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SECRET_KEY is not set",
        )

    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"email": email, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def normalize_email(email: str) -> str:
    return (email or "").lower().strip()


def get_current_user(request: Request) -> str:
    authorization = request.headers.get("Authorization", "")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    if not SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SECRET_KEY is not set",
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = normalize_email(payload.get("email", ""))

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        return email
    except (ExpiredSignatureError, JWTError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def require_admin(current_user_email: str = Depends(get_current_user)) -> str:
    if normalize_email(current_user_email) != normalize_email(ADMIN_EMAIL):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user_email


@auth_router.post("/register")
@limiter.limit("10/minute")
async def register(request: Request, user: RegisterRequest):
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong",
        )

    email = normalize_email(str(user.email))
    existing_user = await users_collection.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Something went wrong",
        )

    password_hash = pwd_context.hash(user.password)
    new_user = {
        "email": email,
        "password_hash": password_hash,
        "name": user.name,
        "created_at": datetime.now(timezone.utc),
    }
    await users_collection.insert_one(new_user)

    return {"message": "User registered successfully"}


@auth_router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, credentials: LoginRequest):
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong",
        )

    email = normalize_email(str(credentials.email))
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Something went wrong",
        )

    if not pwd_context.verify(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Something went wrong",
        )

    access_token = create_access_token(user["email"])

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "name": user["name"],
        },
    }


@auth_router.post("/google")
async def google_login(payload: GoogleLoginRequest):
    print("GOOGLE AUTH: request received")

    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong",
        )

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong",
        )

    try:
        google_request = partial(GoogleRequest(), timeout=10)
        verified_token = id_token.verify_oauth2_token(
            payload.credential,
            google_request,
            GOOGLE_CLIENT_ID,
        )
        email = normalize_email(verified_token.get("email", ""))
        name = verified_token.get("name") or verified_token.get("given_name") or email

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Something went wrong",
            )

        user = await users_collection.find_one({"email": email})
        if not user:
            new_user = {
                "email": email,
                "password_hash": None,
                "name": name,
                "created_at": datetime.now(timezone.utc),
            }
            await users_collection.insert_one(new_user)
            user = new_user

        access_token = create_access_token(user["email"])

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user["email"],
                "name": user["name"],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"GOOGLE AUTH ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong",
        ) from e


@auth_router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user_email: str = Depends(get_current_user),
):
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong",
        )

    email = normalize_email(current_user_email)
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Something went wrong",
        )

    password_hash = user.get("password_hash")
    if not password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Something went wrong",
        )

    if not pwd_context.verify(payload.current_password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Something went wrong",
        )

    await users_collection.update_one(
        {"email": email},
        {"$set": {"password_hash": pwd_context.hash(payload.new_password)}},
    )

    return {"message": "Password changed successfully"}
