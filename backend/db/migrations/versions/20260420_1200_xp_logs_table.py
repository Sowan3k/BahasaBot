"""Add xp_logs table for weekly leaderboard tracking

Each XP award event is recorded here with a timestamp. The weekly
leaderboard sums xp_amount WHERE created_at >= start_of_current_ISO_week
and ranks users without touching the cumulative users.xp_total column.

Revision ID: c1d2e3f4a5b6
Revises:     b5c6d7e8f9a0
Create Date: 2026-04-20 12:00:00
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c1d2e3f4a5b6"
down_revision = "b5c6d7e8f9a0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "xp_logs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("xp_amount", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
    )
    # Composite index optimised for the weekly window GROUP-BY query
    op.create_index("ix_xp_logs_created_at_user_id", "xp_logs", ["created_at", "user_id"])
    op.create_index("ix_xp_logs_user_id", "xp_logs", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_xp_logs_user_id", table_name="xp_logs")
    op.drop_index("ix_xp_logs_created_at_user_id", table_name="xp_logs")
    op.drop_table("xp_logs")
