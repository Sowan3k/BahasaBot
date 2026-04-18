"""Add tips table for Daily Language Tips feature

Creates the tips table which stores AI-generated Bahasa Melayu learning tips
shown to users as a daily toast notification. One random tip per day is
cached in Redis and served publicly without auth.

Revision ID: b5c6d7e8f9a0
Revises:     f3a4b5c6d7e8
Create Date: 2026-04-19 10:00:00
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "b5c6d7e8f9a0"
down_revision = "f3a4b5c6d7e8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tips",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("generated_by", sa.String(50), nullable=False, server_default="gemini"),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_tips_category", "tips", ["category"])
    op.create_index("ix_tips_is_active", "tips", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_tips_is_active", table_name="tips")
    op.drop_index("ix_tips_category", table_name="tips")
    op.drop_table("tips")
