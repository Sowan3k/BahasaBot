"""Phase 20 — My Journey (rewrite): user_roadmaps table

Introduces the new user_roadmaps table that replaces the old
phase/week/activity structure with a flat ordered list of course
obstacles. The old learning_roadmaps table is left untouched for
backward-compatibility with existing Phase 22 migration columns.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_roadmaps",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("intent", sa.String(100), nullable=False),
        sa.Column("goal", sa.Text(), nullable=False),
        sa.Column("timeline_months", sa.Integer(), nullable=False),
        # Ordered array: [{ order, topic, description, estimated_weeks, completed, completed_at }]
        sa.Column("elements", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(20), server_default="active", nullable=False),
        sa.Column("deadline", sa.Date(), nullable=False),
        sa.Column("extended", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("bps_level_at_creation", sa.String(10), nullable=False),
        sa.Column("banner_image_url", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.CheckConstraint(
            "timeline_months BETWEEN 1 AND 6", name="user_roadmaps_timeline_check"
        ),
    )
    op.create_index("ix_user_roadmaps_user_id", "user_roadmaps", ["user_id"])

    # Partial unique index — one ACTIVE roadmap per user
    op.execute(
        """
        CREATE UNIQUE INDEX user_roadmaps_one_active_per_user
          ON user_roadmaps(user_id)
          WHERE status = 'active'
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS user_roadmaps_one_active_per_user")
    op.drop_index("ix_user_roadmaps_user_id", table_name="user_roadmaps")
    op.drop_table("user_roadmaps")
