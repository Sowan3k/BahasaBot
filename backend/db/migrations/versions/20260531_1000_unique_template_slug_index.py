"""Add unique partial index on courses(topic_slug) WHERE is_template = true

Enforces that only one template course can exist per topic_slug. This is the
DB-level guard that makes the race-condition try/except in course_service.py
effective: if two concurrent slow-path requests both try to mark is_template=True
for the same slug, the second commit raises IntegrityError which the service
catches and rolls back, saving the second course as a plain user copy instead.

Without this index the re-check in generate_course() is a soft best-effort
guard only — a race window still exists between the SELECT and the commit.

Revision ID: e3f4a5b6c7d8
Revises:     d2e3f4a5b6c7
Create Date: 2026-05-31 10:00:00
"""

from alembic import op

revision = "e3f4a5b6c7d8"
down_revision = "d2e3f4a5b6c7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Partial unique index — only one row may have is_template=true per topic_slug.
    # Rows where is_template=false are unconstrained (many users can have the same slug).
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_template_per_slug
        ON courses(topic_slug)
        WHERE is_template = true
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_courses_template_per_slug")
