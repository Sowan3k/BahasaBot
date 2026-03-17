"""
Course Service

Orchestrates dynamic course generation:
  - generate_course(topic, user_id, level)    — full pipeline: filter → skeleton → content → save
  - generate_course_skeleton(topic, level)    — Gemini structured JSON skeleton
  - generate_class_content(title, ctx, level) — full Markdown lesson content
  - save_course(data, user_id)                — transactional DB write
  - get_course_with_progress(id, user_id)     — course tree + progress state
"""
# TODO: Implement in Phase 4
