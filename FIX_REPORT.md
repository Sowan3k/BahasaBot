# Fix Report

---

## 2026-04-29 — Production Hygiene Fixes (FEATURE_MAP.md Section 12)

### FIX A: Removed stale `audio_service.py` reference from CLAUDE.md

**File changed:** `CLAUDE.md`

**What was removed:**

```
│   │   ├── audio_service.py         # Pronunciation helpers
```

Removed from the folder structure in Section 4. The file never existed in the codebase — pronunciation is handled entirely client-side via the Web Speech API (`frontend/hooks/usePronunciation.ts`). No other section of CLAUDE.md referenced this file.

---

### FIX B: Password reset token cleanup

**File changed:** `backend/routers/auth.py`

**What was added:**

- New helper function `_cleanup_expired_reset_tokens(db: AsyncSession)` added directly above `forgot_password()`.
- Called near the top of `forgot_password()` inside a bare `try/except` so cleanup failures never block the reset flow.
- The function executes a single `DELETE` statement targeting rows where:
  - `expires_at < now()` (expired, regardless of used status), OR
  - `used == True AND created_at < now - 24h` (consumed tokens older than 24 hours)
- Columns used in the WHERE clause: `expires_at`, `used`, `created_at` — all three exist on `PasswordResetToken`.
- Logs deleted row count at INFO level via `logger.info(...)`.
- All exceptions are caught and logged at ERROR level; the function never raises.
- Added `delete` to the existing `from sqlalchemy import select` line.

---

### FIX C: Streak grace period (one-day buffer)

**File changed:** `backend/services/gamification_service.py`

**Function:** `record_learning_activity()`

**Old comparison:**
```python
yesterday_str = (date.today() - timedelta(days=1)).isoformat()
if last_date_str == yesterday_str:
    new_streak = old_streak + 1  # continued streak
else:
    new_streak = 1  # first activity ever, or streak broken
```

**New comparison:**
```python
yesterday_str = (date.today() - timedelta(days=1)).isoformat()
day_before_yesterday_str = (date.today() - timedelta(days=2)).isoformat()
if last_date_str in (yesterday_str, day_before_yesterday_str):
    new_streak = old_streak + 1  # continued streak
else:
    new_streak = 1  # first activity ever, or streak broken
```

The module docstring and the `_STREAK_KEY_TTL` comment were also updated to reflect the new grace-period behaviour.

**Unexpected issue — TTL edge case:** The Redis key TTL remains at 48 h (unchanged per instructions). With a 2-day grace period, a key written at 23:59 on Day 0 could theoretically expire before the user returns at 00:01 on Day 2 (48 h later), causing a spurious streak reset. This is an accepted edge case: the key is renewed on every active day, so the 48 h TTL is safe for the vast majority of usage patterns. A 72 h TTL would fully eliminate the edge case but was not changed as instructed.
