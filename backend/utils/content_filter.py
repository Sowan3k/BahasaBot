"""
Content Filter

Server-side validation for course topic inputs.
Two-pass approach:
  1. Regex blocklist for obvious inappropriate content
  2. Gemini moderation call for edge cases
Results cached in Redis by topic hash (TTL: 24h).
"""
# TODO: Implement in Phase 4
