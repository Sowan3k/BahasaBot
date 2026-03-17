"""fix_users_missing_columns

Adds the `provider` and `is_active` columns to the users table if they are
missing (they were absent from the original schema.sql that some users ran
before Alembic was set up), and ensures password_hash is nullable (required
for Google OAuth accounts).

Revision ID: a1b2c3d4e5f6
Revises: 9ed1b5d9289b
Create Date: 2026-03-18 00:01:00.000000+00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9ed1b5d9289b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add `provider` column — tracks whether the account uses email/password or Google OAuth.
    # IF NOT EXISTS makes this safe to run on databases that already have the column.
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
        "provider VARCHAR(20) NOT NULL DEFAULT 'email'"
    )

    # Add `is_active` column — allows accounts to be disabled without deletion.
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
        "is_active BOOLEAN NOT NULL DEFAULT TRUE"
    )

    # Make password_hash nullable — Google OAuth users have no password.
    # This is safe even if the column is already nullable.
    op.execute(
        "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"
    )

    # Ensure proficiency_level column exists with correct default (in case schema.sql
    # created it as proficiency_level VARCHAR(2) — expand to VARCHAR(5) just in case)
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
        "proficiency_level VARCHAR(5) NOT NULL DEFAULT 'A1'"
    )


def downgrade() -> None:
    # Reverting these is destructive — only do so in development.
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS provider")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS is_active")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS proficiency_level")
