"""add gender and age_range to users

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-04-15 22:00:00
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f3a4b5c6d7e8"
down_revision = "e2f3a4b5c6d7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add gender and age_range columns to users table.

    Both are nullable — existing users and users who skip onboarding will have
    NULL values.  The image_service uses these to personalise the roadmap banner
    prompt; NULL values fall back to a neutral/generic prompt.
    """
    op.add_column(
        "users",
        sa.Column("gender", sa.String(20), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("age_range", sa.String(20), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "age_range")
    op.drop_column("users", "gender")
