-- BahasaBot — Reference Database Schema
-- This file is for reference only. Use Alembic migrations for all schema changes.
-- Run: alembic upgrade head

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Users ──────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(2) DEFAULT 'A1' CHECK (proficiency_level IN ('A1','A2','B1','B2')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Courses ────────────────────────────────────────────────────────────────────
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    topic VARCHAR(500) NOT NULL,
    objectives JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    vocabulary_json JSONB DEFAULT '[]',
    examples_json JSONB DEFAULT '[]',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Progress ───────────────────────────────────────────────────────────────────
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE module_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    answers_json JSONB DEFAULT '{}',
    taken_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE standalone_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    questions_json JSONB DEFAULT '[]',
    answers_json JSONB DEFAULT '{}',
    taken_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Learning Tracking ──────────────────────────────────────────────────────────
CREATE TABLE vocabulary_learned (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word VARCHAR(255) NOT NULL,
    meaning TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('chatbot', 'course')),
    source_id UUID,
    learned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grammar_learned (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule TEXT NOT NULL,
    example TEXT,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('chatbot', 'course')),
    source_id UUID,
    learned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weak_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('vocab', 'grammar')),
    strength_score FLOAT DEFAULT 0.0 CHECK (strength_score >= 0.0 AND strength_score <= 1.0),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, topic, type)
);

-- ── Chatbot ────────────────────────────────────────────────────────────────────
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RAG Vector Store ──────────────────────────────────────────────────────────
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(768),
    metadata_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_classes_module_id ON classes(module_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_class_id ON user_progress(class_id);
CREATE INDEX idx_module_quiz_user_id ON module_quiz_attempts(user_id);
CREATE INDEX idx_standalone_quiz_user_id ON standalone_quiz_attempts(user_id);
CREATE INDEX idx_vocabulary_user_id ON vocabulary_learned(user_id);
CREATE INDEX idx_grammar_user_id ON grammar_learned(user_id);
CREATE INDEX idx_weak_points_user_id ON weak_points(user_id, strength_score DESC);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
