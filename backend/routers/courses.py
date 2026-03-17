"""
Courses Router — /api/courses/*

Endpoints:
  POST /api/courses/generate                               — generate course from topic
  GET  /api/courses/                                       — list user's courses (paginated)
  GET  /api/courses/{course_id}                            — full course tree with progress
  POST /api/courses/{course_id}/modules/{module_id}/complete — mark module complete
  GET  /api/courses/{course_id}/modules/{module_id}/quiz  — get module quiz
  POST /api/courses/{course_id}/modules/{module_id}/quiz  — submit module quiz
"""
# TODO: Implement in Phase 4 (course generation) and Phase 5 (module quiz)
