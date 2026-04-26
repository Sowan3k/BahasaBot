"""
create_admin.py — One-time script to seed a specific admin account directly into the DB.

Usage (from project root bahasabot/):
    backend/venv/Scripts/python.exe -m backend.data.create_admin

Safe to re-run: skips creation if email already exists, always runs verification.
"""

import asyncio
import os
import sys
import uuid

# Allow running as `python -m backend.data.create_admin` from bahasabot/ root
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_project_root = os.path.dirname(_backend_dir)
for _p in (_project_root, _backend_dir):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from dotenv import load_dotenv
load_dotenv(os.path.join(_backend_dir, ".env"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Use the exact same hash/verify helpers the login endpoint uses
from backend.routers.auth import _hash_password, _verify_password
from backend.db.database import AsyncSessionLocal
from backend.models.user import User


# ── Admin account to seed ─────────────────────────────────────────────────────
ADMIN_EMAIL = "drtan@testadmin.com"
ADMIN_PASSWORD = "CSE404SE"
ADMIN_NAME = "Dr. Tan Tien Ping"
# ─────────────────────────────────────────────────────────────────────────────


async def _verify(db: AsyncSession) -> None:
    """SELECT the row and verify the password hash — always runs after create/skip."""
    result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
    user = result.scalar_one_or_none()

    print("\n-- Verification -------------------------------------")
    if user is None:
        print("  [FAIL] Row not found in DB.")
        return

    print(f"  Email             : {user.email}")
    print(f"  Name              : {user.name}")
    print(f"  Role              : {user.role}")
    print(f"  Provider          : {user.provider}")
    print(f"  Proficiency       : {user.proficiency_level}")
    print(f"  Onboarding done   : {user.onboarding_completed}")
    print(f"  ID                : {user.id}")
    print(f"  password_hash set : {user.password_hash is not None}")

    # Verify password using the same function the login endpoint calls
    password_ok = (
        user.password_hash is not None
        and _verify_password(ADMIN_PASSWORD, user.password_hash)
    )
    flag = "PASS" if password_ok else "FAIL"
    print(f"\n  Password check    : [{flag}]  (used _verify_password from routers/auth.py)")

    if user.role == "admin" and password_ok:
        print("\n  [OK] Account is ready — role=admin, password verifies correctly.")
    else:
        if user.role != "admin":
            print(f"\n  [FAIL] role='{user.role}', expected 'admin'.")
        if not password_ok:
            print("\n  [FAIL] Password does not verify against stored hash.")
    print("-----------------------------------------------------")


async def create_admin() -> None:
    """Insert the admin user if they do not already exist, then verify."""
    async with AsyncSessionLocal() as db:
        db: AsyncSession

        result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
        existing = result.scalar_one_or_none()

        if existing is not None:
            if existing.role != "admin":
                existing.role = "admin"
                await db.commit()
                print(f"[upgraded] {ADMIN_EMAIL} role updated to 'admin'.")
            else:
                print(f"[skip] {ADMIN_EMAIL} already exists with role='admin'. No changes made.")
        else:
            admin_user = User(
                id=uuid.uuid4(),
                email=ADMIN_EMAIL,
                # _hash_password is the same helper used by POST /api/auth/register
                password_hash=_hash_password(ADMIN_PASSWORD),
                name=ADMIN_NAME,
                provider="email",
                proficiency_level="BPS-1",
                role="admin",
                onboarding_completed=True,
            )
            db.add(admin_user)
            await db.commit()
            print(f"[created] Admin account seeded.")

        await _verify(db)


if __name__ == "__main__":
    asyncio.run(create_admin())
