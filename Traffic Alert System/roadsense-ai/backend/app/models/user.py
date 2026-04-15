"""
MongoDB user document shape for the `users` collection.
Field names match persisted documents; use dicts with Motor inserts.
"""
from datetime import datetime
from typing import Any


def user_doc(
    full_name: str,
    email: str,
    hashed_password: str,
) -> dict[str, Any]:
    """Build a new user document for insertion."""
    now = datetime.utcnow()
    return {
        "full_name": full_name,
        "email": email.lower().strip(),
        "hashed_password": hashed_password,
        "created_at": now,
        "last_login": now,
        "total_predictions": 0,
    }
