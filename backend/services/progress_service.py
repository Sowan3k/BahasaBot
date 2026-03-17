"""
Progress Service

Aggregates user learning data for the dashboard:
  - get_dashboard_summary(user_id)        — stats summary (Redis cached 5 min)
  - get_vocabulary_list(user_id, page)    — paginated vocabulary
  - get_grammar_list(user_id, page)       — paginated grammar rules
  - get_quiz_history(user_id, page)       — quiz attempts history
  - get_weak_points_analysis(user_id)     — top weak points + recommendations
"""
# TODO: Implement in Phase 7
