"""Phase 22 — Image Generation column changes

- courses.cover_image_url: VARCHAR(1000) → TEXT (base64 data URLs exceed 1000 chars)
- learning_roadmaps.banner_image_url: VARCHAR(1000) → TEXT
- notifications: add image_url TEXT NULL (for BPS milestone card images)

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
"""

from alembic import op
import sqlalchemy as sa

revision = "a7b8c9d0e1f2"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Change VARCHAR(1000) → TEXT for image URL columns
    op.alter_column(
        "courses",
        "cover_image_url",
        type_=sa.Text(),
        existing_nullable=True,
    )
    op.alter_column(
        "learning_roadmaps",
        "banner_image_url",
        type_=sa.Text(),
        existing_nullable=True,
    )

    # Add image_url to notifications (milestone card base64 data URL)
    op.add_column(
        "notifications",
        sa.Column("image_url", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("notifications", "image_url")

    op.alter_column(
        "learning_roadmaps",
        "banner_image_url",
        type_=sa.String(1000),
        existing_nullable=True,
    )
    op.alter_column(
        "courses",
        "cover_image_url",
        type_=sa.String(1000),
        existing_nullable=True,
    )
