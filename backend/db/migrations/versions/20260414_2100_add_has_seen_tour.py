"""add has_seen_tour to users

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-04-14 21:00:00
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e2f3a4b5c6d7"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add has_seen_tour boolean column to users table.

    Tracks whether the user has seen the first-login UI spotlight tour.
    Once set to true it is never reset — the tour shows exactly once per account.
    """
    op.add_column(
        "users",
        sa.Column(
            "has_seen_tour",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "has_seen_tour")
