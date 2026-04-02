"""phase11_schema — add new tables and columns for Phases 12–22

New tables:
  learning_roadmaps, roadmap_activity_completions, notifications,
  password_reset_tokens, evaluation_feedback, spelling_game_scores

New columns on users:
  onboarding_completed, native_language, learning_goal, profile_picture_url,
  role, streak_count, xp_total

New column on courses:
  cover_image_url

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-04-02 11:00:00.000000+00:00
"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── New columns on users ──────────────────────────────────────────────────
    op.add_column('users', sa.Column(
        'onboarding_completed', sa.Boolean(), nullable=False,
        server_default=sa.text('false')
    ))
    op.add_column('users', sa.Column(
        'native_language', sa.String(100), nullable=True
    ))
    op.add_column('users', sa.Column(
        'learning_goal', sa.String(500), nullable=True
    ))
    op.add_column('users', sa.Column(
        'profile_picture_url', sa.String(1000), nullable=True
    ))
    op.add_column('users', sa.Column(
        'role', sa.String(20), nullable=False,
        server_default=sa.text("'user'")
    ))
    op.add_column('users', sa.Column(
        'streak_count', sa.Integer(), nullable=False,
        server_default=sa.text('0')
    ))
    op.add_column('users', sa.Column(
        'xp_total', sa.Integer(), nullable=False,
        server_default=sa.text('0')
    ))

    # ── New column on courses ─────────────────────────────────────────────────
    op.add_column('courses', sa.Column(
        'cover_image_url', sa.String(1000), nullable=True
    ))

    # ── learning_roadmaps ─────────────────────────────────────────────────────
    op.create_table(
        'learning_roadmaps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('deadline_date', sa.Date(), nullable=False),
        # 'survival' | 'conversational' | 'academic'
        sa.Column('goal_type', sa.String(50), nullable=False),
        sa.Column('roadmap_json', postgresql.JSONB(), nullable=False),
        sa.Column('banner_image_url', sa.String(1000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_learning_roadmaps_user_id', 'learning_roadmaps', ['user_id'])

    # ── roadmap_activity_completions ──────────────────────────────────────────
    op.create_table(
        'roadmap_activity_completions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        # Unique string key per activity within a roadmap (e.g. "phase1_week2_act3")
        sa.Column('activity_id', sa.String(100), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
    )

    # ── notifications ─────────────────────────────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        # e.g. 'streak_milestone' | 'xp_milestone' | 'journey_reminder' | 'course_complete'
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])

    # ── password_reset_tokens ─────────────────────────────────────────────────
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        # SHA-256 hash of the raw token sent to the user's email
        sa.Column('token_hash', sa.String(255), nullable=False, unique=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_password_reset_tokens_token_hash', 'password_reset_tokens', ['token_hash'])

    # ── evaluation_feedback ───────────────────────────────────────────────────
    op.create_table(
        'evaluation_feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        # 'module' | 'standalone'
        sa.Column('quiz_type', sa.String(50), nullable=False),
        # 1–5 overall experience rating
        sa.Column('rating', sa.Integer(), nullable=False),
        # 'yes' | 'no' | 'somewhat'
        sa.Column('weak_points_relevant', sa.String(20), nullable=False),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
    )

    # ── spelling_game_scores ──────────────────────────────────────────────────
    op.create_table(
        'spelling_game_scores',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('words_correct', sa.Integer(), nullable=False),
        sa.Column('words_attempted', sa.Integer(), nullable=False),
        sa.Column('session_date', sa.Date(), nullable=False),
    )


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table('spelling_game_scores')
    op.drop_table('evaluation_feedback')
    op.drop_index('ix_password_reset_tokens_token_hash', table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')
    op.drop_table('roadmap_activity_completions')
    op.drop_index('ix_learning_roadmaps_user_id', table_name='learning_roadmaps')
    op.drop_table('learning_roadmaps')

    # Drop new columns
    op.drop_column('courses', 'cover_image_url')
    op.drop_column('users', 'xp_total')
    op.drop_column('users', 'streak_count')
    op.drop_column('users', 'role')
    op.drop_column('users', 'profile_picture_url')
    op.drop_column('users', 'learning_goal')
    op.drop_column('users', 'native_language')
    op.drop_column('users', 'onboarding_completed')
