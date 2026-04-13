"""Drop v1 journey tables (learning_roadmaps, roadmap_activity_completions)

The v1 tables were created in Phase 11 and superseded by user_roadmaps (Phase 20 v2).
No code references these tables any more — the LearningRoadmap / RoadmapActivityCompletion
ORM models have been removed from backend/models/journey.py.

Revision ID: c9d0e1f2a3b4
Revises:     b8c9d0e1f2a3
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c9d0e1f2a3b4"
down_revision = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # roadmap_activity_completions has no FK to learning_roadmaps (only user_id → users).
    # Drop it first for clarity, then drop learning_roadmaps.
    op.drop_table("roadmap_activity_completions")

    op.drop_index("ix_learning_roadmaps_user_id", table_name="learning_roadmaps")
    op.drop_table("learning_roadmaps")


def downgrade() -> None:
    # Recreate learning_roadmaps — banner_image_url is TEXT (Phase 22 already ran above us in the chain)
    op.create_table(
        "learning_roadmaps",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("deadline_date", sa.Date(), nullable=False),
        sa.Column("goal_type", sa.String(50), nullable=False),
        sa.Column("roadmap_json", postgresql.JSONB(), nullable=False),
        # TEXT — Phase 22 already altered this from VARCHAR(1000); recreate as TEXT
        sa.Column("banner_image_url", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_learning_roadmaps_user_id", "learning_roadmaps", ["user_id"])

    # Recreate roadmap_activity_completions
    op.create_table(
        "roadmap_activity_completions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("activity_id", sa.String(100), nullable=False),
        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
