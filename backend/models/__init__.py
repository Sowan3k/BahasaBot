# Import all ORM models so Alembic autogenerate can discover them and
# SQLAlchemy metadata is fully populated before any migration or query runs.

from backend.models.analytics import ActivityLog, TokenUsageLog  # noqa: F401
from backend.models.chatbot import ChatMessage, ChatSession  # noqa: F401
from backend.models.course import Class, Course, Module  # noqa: F401
from backend.models.document import Document  # noqa: F401
from backend.models.evaluation import EvaluationFeedback  # noqa: F401
from backend.models.game import SpellingGameScore  # noqa: F401
from backend.models.journey import UserRoadmap  # noqa: F401
from backend.models.notification import Notification  # noqa: F401
from backend.models.password_reset import PasswordResetToken  # noqa: F401
from backend.models.progress import GrammarLearned, UserProgress, VocabularyLearned, WeakPoint  # noqa: F401
from backend.models.quiz import ModuleQuizAttempt, StandaloneQuizAttempt  # noqa: F401
from backend.models.user import User  # noqa: F401
