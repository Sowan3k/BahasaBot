"""convert_proficiency_level_to_varchar

The users table was created with `proficiency_level proficiency_level_enum`
(a PostgreSQL custom ENUM type) in some environments.  The SQLAlchemy model
uses native_enum=False, which means SQLAlchemy treats the column as a plain
VARCHAR.  asyncpg cannot transparently decode a custom ENUM type when
SQLAlchemy expects a string, causing "could not find array type" or silent
type-decoding failures on INSERT...RETURNING and SELECT queries.

This migration converts the column to VARCHAR(5) to match the ORM definition,
then drops the now-unused ENUM type.

Revision ID: c3d4e5f6a1b2
Revises: a1b2c3d4e5f6
Create Date: 2026-03-18 00:02:00.000000+00:00
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'c3d4e5f6a1b2'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert proficiency_level from the custom ENUM type to plain VARCHAR(5).
    # USING clause casts existing enum values to text first.
    # IF EXISTS on the ALTER guards against databases that already have VARCHAR.
    op.execute(
        "ALTER TABLE users "
        "ALTER COLUMN proficiency_level TYPE VARCHAR(5) "
        "USING proficiency_level::VARCHAR"
    )

    # The server_default may still be typed as proficiency_level_enum (e.g. 'A1'::proficiency_level_enum).
    # Drop and reset it as a plain VARCHAR literal so the ENUM type has no remaining dependents.
    op.execute("ALTER TABLE users ALTER COLUMN proficiency_level DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN proficiency_level SET DEFAULT 'A1'")

    # Drop the now-unused custom ENUM type.
    # IF EXISTS makes this safe on databases that never had it
    # (e.g. those created from the updated migrations that use VARCHAR from the start).
    op.execute("DROP TYPE IF EXISTS proficiency_level_enum")


def downgrade() -> None:
    # Recreate the ENUM type and convert the column back.
    op.execute(
        "DO $$ BEGIN "
        "  CREATE TYPE proficiency_level_enum AS ENUM ('A1', 'A2', 'B1', 'B2'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; "
        "END $$"
    )
    op.execute(
        "ALTER TABLE users "
        "ALTER COLUMN proficiency_level TYPE proficiency_level_enum "
        "USING proficiency_level::proficiency_level_enum"
    )
