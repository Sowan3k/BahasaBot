"""Add course deduplication template columns (Phase 23)

Adds three columns to the courses table to support the template/clone system:
  - topic_slug   VARCHAR(600)  — normalised "topic:level" key for template lookup
  - is_template  BOOLEAN       — True only for the first generated version of a topic+level
  - cloned_from  UUID          — FK back to the template course (nullable; SET NULL on delete)

Existing rows get topic_slug = NULL and is_template = FALSE, meaning they behave
as ordinary courses until they happen to match a new request (they won't be picked
up as templates until topic_slug is backfilled, which is intentional — we only
deduplicate going forward from this migration).

Revision ID: d1e2f3a4b5c6
Revises:     c9d0e1f2a3b4
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d1e2f3a4b5c6"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Nullable — existing rows carry NULL until the service layer starts writing slugs
    op.add_column("courses", sa.Column("topic_slug", sa.String(600), nullable=True))

    op.add_column(
        "courses",
        sa.Column(
            "is_template",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # Self-referential FK — SET NULL if the template row is ever deleted
    op.add_column(
        "courses",
        sa.Column(
            "cloned_from",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # Index drives the single SELECT used by _find_template() on every generate request
    op.create_index("ix_courses_topic_slug", "courses", ["topic_slug"])


def downgrade() -> None:
    op.drop_index("ix_courses_topic_slug", table_name="courses")
    op.drop_column("courses", "cloned_from")
    op.drop_column("courses", "is_template")
    op.drop_column("courses", "topic_slug")
