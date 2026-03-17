"""initial_schema

Revision ID: 9ed1b5d9289b
Revises:
Create Date: 2026-03-17 18:56:50.095303+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy  # noqa: F401 — needed for Vector column type
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9ed1b5d9289b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension — required before creating the documents table
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # ── users ─────────────────────────────────────────────────────────────────
    # Created first because all other tables have FK references to users.id.
    # Uses IF NOT EXISTS so the migration is safe to re-run if users was created
    # manually before Alembic was set up.
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255),
            name VARCHAR(255) NOT NULL,
            provider VARCHAR(20) NOT NULL DEFAULT 'email',
            proficiency_level VARCHAR(5) NOT NULL DEFAULT 'A1',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            is_active BOOLEAN NOT NULL DEFAULT TRUE
        )
    """)
    # Add missing columns to an existing users table (idempotent)
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'email'")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE")
    # Ensure password_hash is nullable (schema.sql had it NOT NULL; OAuth users have no password)
    op.execute("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL")
    # Ensure unique index on email (use IF NOT EXISTS to be safe)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)")

    # ── documents ─────────────────────────────────────────────────────────────
    op.create_table('documents',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(dim=768), nullable=True),
        sa.Column('metadata_json', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents "
        "USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )

    # ── chat_sessions ─────────────────────────────────────────────────────────
    op.create_table('chat_sessions',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_chat_sessions_user_id ON chat_sessions (user_id)")

    # ── chat_messages ─────────────────────────────────────────────────────────
    op.create_table('chat_messages',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_chat_messages_session_id ON chat_messages (session_id)")

    # ── courses ───────────────────────────────────────────────────────────────
    op.create_table('courses',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('topic', sa.String(length=500), nullable=False),
        sa.Column('objectives', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_courses_user_id ON courses (user_id)")

    # ── modules ───────────────────────────────────────────────────────────────
    op.create_table('modules',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_modules_course_id ON modules (course_id)")

    # ── classes ───────────────────────────────────────────────────────────────
    op.create_table('classes',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('module_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('vocabulary_json', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('examples_json', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_classes_module_id ON classes (module_id)")

    # ── module_quiz_attempts ──────────────────────────────────────────────────
    op.create_table('module_quiz_attempts',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('module_id', sa.UUID(), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('answers_json', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('taken_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_module_quiz_attempts_user_id ON module_quiz_attempts (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_module_quiz_attempts_module_id ON module_quiz_attempts (module_id)")

    # ── standalone_quiz_attempts ──────────────────────────────────────────────
    op.create_table('standalone_quiz_attempts',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('questions_json', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('answers_json', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('taken_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_standalone_quiz_attempts_user_id ON standalone_quiz_attempts (user_id)")

    # ── user_progress ─────────────────────────────────────────────────────────
    op.create_table('user_progress',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=False),
        sa.Column('module_id', sa.UUID(), nullable=False),
        sa.Column('class_id', sa.UUID(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_progress_user_id ON user_progress (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_progress_course_id ON user_progress (course_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_progress_module_id ON user_progress (module_id)")

    # ── vocabulary_learned ────────────────────────────────────────────────────
    op.create_table('vocabulary_learned',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('word', sa.String(length=255), nullable=False),
        sa.Column('meaning', sa.Text(), nullable=False),
        sa.Column('source_type', sa.String(length=20), nullable=False),
        sa.Column('source_id', sa.UUID(), nullable=True),
        sa.Column('learned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_vocabulary_learned_user_id ON vocabulary_learned (user_id)")

    # ── grammar_learned ───────────────────────────────────────────────────────
    op.create_table('grammar_learned',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('rule', sa.Text(), nullable=False),
        sa.Column('example', sa.Text(), nullable=False),
        sa.Column('source_type', sa.String(length=20), nullable=False),
        sa.Column('source_id', sa.UUID(), nullable=True),
        sa.Column('learned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_grammar_learned_user_id ON grammar_learned (user_id)")

    # ── weak_points ───────────────────────────────────────────────────────────
    op.create_table('weak_points',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('topic', sa.String(length=500), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('strength_score', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_weak_points_user_id ON weak_points (user_id)")


def downgrade() -> None:
    op.drop_table('weak_points')
    op.drop_table('grammar_learned')
    op.drop_table('vocabulary_learned')
    op.drop_table('user_progress')
    op.drop_table('standalone_quiz_attempts')
    op.drop_table('module_quiz_attempts')
    op.drop_table('classes')
    op.drop_table('modules')
    op.drop_table('courses')
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
    op.drop_table('documents')
    op.drop_table('users')
