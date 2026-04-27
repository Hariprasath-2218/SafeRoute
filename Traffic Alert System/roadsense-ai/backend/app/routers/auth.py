"""Authentication routes: register, login, me."""
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.deps import get_current_user
from app.database import get_database
from app.models.user import user_doc
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UpdatePasswordRequest,
    UpdateProfileRequest,
    UserPublic,
)
from app.services.auth_service import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize_user(doc: dict) -> UserPublic:
    """Map Mongo user document to public DTO."""
    return UserPublic(
        id=str(doc["_id"]),
        full_name=doc["full_name"],
        email=doc["email"],
        created_at=doc["created_at"].isoformat() if doc.get("created_at") else None,
        last_login=doc["last_login"].isoformat() if doc.get("last_login") else None,
        total_predictions=int(doc.get("total_predictions", 0)),
    )


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24,
    )


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, response: Response) -> TokenResponse:
    """Create a new user with bcrypt-hashed password and return JWT."""
    db = get_database()
    existing = await db["users"].find_one({"email": body.email.lower().strip()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    doc = user_doc(body.full_name, body.email, hash_password(body.password))
    result = await db["users"].insert_one(doc)
    user_id = str(result.inserted_id)
    token = create_access_token({"sub": user_id})
    _set_auth_cookie(response, token)
    created = await db["users"].find_one({"_id": result.inserted_id})
    return TokenResponse(access_token=token, user=_serialize_user(created))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response) -> TokenResponse:
    """Verify credentials and return JWT with user profile."""
    return await _login_user(body, response)


@router.post("/login-test", response_model=TokenResponse, include_in_schema=False)
async def login_test(body: LoginRequest, response: Response) -> TokenResponse:
    """Compatibility alias for direct route testing."""
    return await _login_user(body, response)


async def _login_user(body: LoginRequest, response: Response) -> TokenResponse:
    """Shared login implementation for the auth route and compatibility alias."""
    db = get_database()
    user = await db["users"].find_one({"email": body.email.lower().strip()})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}},
    )
    user = await db["users"].find_one({"_id": user["_id"]})
    token = create_access_token({"sub": str(user["_id"])})
    _set_auth_cookie(response, token)
    return TokenResponse(access_token=token, user=_serialize_user(user))


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie("access_token")
    return {"ok": True}


@router.get("/me", response_model=UserPublic)
async def me(current: dict = Depends(get_current_user)) -> UserPublic:
    """Return the authenticated user's profile (requires Bearer token)."""
    return _serialize_user(current)


@router.put("/profile", response_model=UserPublic)
async def update_profile(
    body: UpdateProfileRequest,
    current: dict = Depends(get_current_user),
) -> UserPublic:
    """Update authenticated user's profile fields."""
    db = get_database()
    full_name = body.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=400, detail="Full name cannot be empty")

    await db["users"].update_one(
        {"_id": current["_id"]},
        {"$set": {"full_name": full_name}},
    )
    updated = await db["users"].find_one({"_id": current["_id"]})
    return _serialize_user(updated)


@router.put("/password")
async def update_password(
    body: UpdatePasswordRequest,
    current: dict = Depends(get_current_user),
) -> dict:
    """Change user password after verifying current password."""
    if not verify_password(body.current_password, current["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password",
        )

    db = get_database()
    await db["users"].update_one(
        {"_id": current["_id"]},
        {"$set": {"hashed_password": hash_password(body.new_password)}},
    )
    return {"ok": True, "message": "Password updated successfully"}
