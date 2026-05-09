"""Add game_type column to spelling_game_scores for multi-game support

Allows the table to store both 'spelling' and 'word_match' game sessions
without needing a separate table. All existing rows default to 'spelling'.

Revision ID: d2e3f4a5b6c7
Revises:     c1d2e3f4a5b6
Create Date: 2026-05-09 10:00:00
"""

import sqlalchemy as sa
from alembic import op

revision = "d2e3f4a5b6c7"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "spelling_game_scores",
        sa.Column(
            "game_type",
            sa.String(50),
            nullable=False,
            server_default="spelling",
        ),
    )
    op.create_index(
        "ix_spelling_game_scores_game_type_user",
        "spelling_game_scores",
        ["game_type", "user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_spelling_game_scores_game_type_user",
        table_name="spelling_game_scores",
    )
    op.drop_column("spelling_game_scores", "game_type")
