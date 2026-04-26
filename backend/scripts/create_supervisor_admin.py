"""
create_supervisor_admin.py
One-off script to seed the FYP supervisor admin account.

Run from the bahasabot/ project root:
    backend/venv/Scripts/python.exe -m backend.scripts.create_supervisor_admin

Idempotent: if the email already exists the password is updated and role is
forced to 'admin'. No other accounts are touched.

Column reference (backend/models/user.py):
    email          String(255) unique
    password_hash  String(255) nullable  <- bcrypt hash stored here
    name           String(255)
    provider       "email" | "google"
    role           "user" | "admin"      <- admin flag
    onboarding_completed  bool
    is_active      bool default True
"""

import asyncio
import os
import sys
import uuid

# ── sys.path: must resolve as `backend.*` package ────────────────────────────
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_project_root = os.path.dirname(_backend_dir)
for _p in (_project_root, _backend_dir):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from dotenv import load_dotenv
load_dotenv(os.path.join(_backend_dir, ".env"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# _hash_password / _verify_password are the exact helpers used by the live
# POST /api/auth/register and POST /api/auth/login endpoints.
from backend.routers.auth import _hash_password, _verify_password
from backend.db.database import AsyncSessionLocal
from backend.models.user import User

# ── Credentials ───────────────────────────────────────────────────────────────
_EMAIL = "DrTan@gmail.testadmin"
_PASSWORD = "CAT404SE"
_NAME = "Dr. Tan"
# ─────────────────────────────────────────────────────────────────────────────


async def _print_verification(db: AsyncSession) -> bool:
    """
    Re-SELECT the row and verify password + role.
    Returns True only when both checks pass.
    """
    result = await db.execute(select(User).where(User.email == _EMAIL))
    user = result.scalar_one_or_none()

    print("\n-- Verification -------------------------------------")
    if user is None:
        print("  [FAIL] Row not found in DB after write.")
        print("-----------------------------------------------------")
        return False

    # Confirm stored fields
    print(f"  email             : {user.email}")
    print(f"  name              : {user.name}")
    print(f"  role              : {user.role}")
    print(f"  provider          : {user.provider}")
    print(f"  proficiency_level : {user.proficiency_level}")
    print(f"  is_active         : {user.is_active}")
    print(f"  onboarding_done   : {user.onboarding_completed}")
    print(f"  password_hash set : {user.password_hash is not None}")
    print(f"  id                : {user.id}")

    # Password check using the same function as POST /api/auth/login
    pw_ok = (
        user.password_hash is not None
        and _verify_password(_PASSWORD, user.password_hash)
    )
    role_ok = user.role == "admin"

    print(f"\n  password check    : {'[PASS]' if pw_ok   else '[FAIL]'}  "
          f"(_verify_password from routers/auth.py)")
    print(f"  role check        : {'[PASS]' if role_ok else '[FAIL]'}  "
          f"(expected 'admin', got '{user.role}')")

    all_ok = pw_ok and role_ok
    if all_ok:
        print("\n  [OK] Account is ready — role=admin, password verifies correctly.")
    else:
        print("\n  [FAIL] One or more checks did not pass — see above.")
    print("-----------------------------------------------------")
    return all_ok


async def main() -> None:
    async with AsyncSessionLocal() as db:
        db: AsyncSession

        result = await db.execute(select(User).where(User.email == _EMAIL))
        existing = result.scalar_one_or_none()

        if existing is not None:
            # Idempotent update: refresh password and force admin role
            existing.password_hash = _hash_password(_PASSWORD)
            existing.role = "admin"
            existing.name = _NAME
            await db.commit()
            print(f"[updated] {_EMAIL} — password refreshed, role='admin' confirmed.")
        else:
            user = User(
                id=uuid.uuid4(),
                email=_EMAIL,
                password_hash=_hash_password(_PASSWORD),
                name=_NAME,
                provider="email",
                proficiency_level="BPS-1",
                role="admin",
                is_active=True,
                onboarding_completed=True,  # skip first-login onboarding for admin
                has_seen_tour=True,         # skip spotlight tour for admin
            )
            db.add(user)
            await db.commit()
            print(f"[created] {_EMAIL} — new admin account inserted.")

        # Always verify after the write
        passed = await _print_verification(db)
        if not passed:
            raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
