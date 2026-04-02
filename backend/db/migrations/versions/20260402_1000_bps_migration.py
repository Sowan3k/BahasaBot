"""bps_migration — rename CEFR labels to BPS labels

Renames proficiency level values stored in the users table:
  A1  → BPS-1  (Beginner)
  A2  → BPS-2  (Elementary)
  B1  → BPS-3  (Intermediate)
  B2  → BPS-4  (Upper-Intermediate)

The column remains VARCHAR(5) — 'BPS-1' through 'BPS-4' are all 5 characters.

Revision ID: d5e6f7a8b9c0
Revises: c3d4e5f6a1b2
Create Date: 2026-04-02 10:00:00.000000+00:00
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, None] = 'c3d4e5f6a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename CEFR labels to BPS labels.
    # Order matters: apply in a safe sequence so no value is overwritten
    # before it is read (all source labels are distinct from all target labels).
    op.execute("UPDATE users SET proficiency_level = 'BPS-1' WHERE proficiency_level = 'A1'")
    op.execute("UPDATE users SET proficiency_level = 'BPS-2' WHERE proficiency_level = 'A2'")
    op.execute("UPDATE users SET proficiency_level = 'BPS-3' WHERE proficiency_level = 'B1'")
    op.execute("UPDATE users SET proficiency_level = 'BPS-4' WHERE proficiency_level = 'B2'")


def downgrade() -> None:
    # Reverse: BPS labels back to CEFR labels.
    op.execute("UPDATE users SET proficiency_level = 'A1' WHERE proficiency_level = 'BPS-1'")
    op.execute("UPDATE users SET proficiency_level = 'A2' WHERE proficiency_level = 'BPS-2'")
    op.execute("UPDATE users SET proficiency_level = 'B1' WHERE proficiency_level = 'BPS-3'")
    op.execute("UPDATE users SET proficiency_level = 'B2' WHERE proficiency_level = 'BPS-4'")
