---

# BahasaBot — Testing Checklist
_Run tests after all phases are complete and the app is deployed_
_Tell Claude "Read .claude/TESTING.md. Run test [number] or tests [X–Y]."_

---

## How to run tests
Say: "Read .claude/CLAUDE.md and .claude/TESTING.md. Run test [number]."

---

## SECTION 1 — Authentication Tests

### Test 1 — Email Registration
- Register a new account with valid email + password
- Verify user row created in users table with correct fields
- Verify onboarding_completed = false on new user
- Verify password is stored as bcrypt hash, never plaintext
- Verify JWT access token + refresh token returned on success
- Try registering with same email again — expect 409 conflict error

### Test 2 — Email Login
- Login with valid credentials — expect 200 + tokens
- Login with wrong password — expect 401
- Login with unregistered email — expect 401
- Verify access token expires after 30 minutes
- Verify refresh token valid for 7 days

### Test 3 — Google OAuth Login
- Sign in with Google — verify user created with provider='google'
- Sign in again with same Google account — verify no duplicate user created
- Verify password_hash is null for Google accounts
- Verify JWT tokens returned correctly

### Test 4 — Token Refresh
- Use expired access token — expect 401
- Call POST /api/auth/refresh with valid refresh token — expect new access token
- Call POST /api/auth/refresh with invalid token — expect 401

### Test 5 — Protected Routes
- Access any /api/dashboard endpoint without token — expect 401
- Access any /api/courses endpoint without token — expect 401
- Access frontend /dashboard without session — verify redirect to /login

### Test 6 — Forgot Password Flow
- Submit forgot password with registered email — verify email sent via Resend
- Submit forgot password with unregistered email — expect 200 (no user enumeration leak)
- Click reset link — verify token accepted and password updated
- Try using same reset link again — expect 400 (token already used)
- Try using expired reset link (after 15 min) — expect 400
- Verify Google OAuth accounts see correct message instead of reset form

---

## SECTION 2 — User Profile Tests

### Test 7 — Profile Management
- GET /api/profile/ — verify all fields returned correctly
- PATCH /api/profile/ with new name — verify updated in DB
- PATCH /api/profile/ with native_language and learning_goal — verify saved
- Try to PATCH email via profile endpoint — expect field ignored or 400
- Try to PATCH role via profile endpoint — expect field ignored or 400

### Test 8 — Onboarding Flow
- Login as brand new user — verify OnboardingModal appears
- Complete all onboarding steps — verify onboarding_completed = true in DB
- Verify native_language and learning_goal saved after onboarding
- Login again as same user — verify onboarding modal does NOT appear again
- Skip onboarding mid-way — verify modal reappears on next login if not completed

### Test 9 — Settings Pages
- Navigate to /settings — verify hub loads with links to Profile, Password, About
- Navigate to /settings/profile — verify profile data pre-populated in form
- Navigate to /settings/password — submit current + new password — verify updated
- Submit wrong current password on password change — expect 400
- Navigate to /settings/about — verify Sowan name, Dr. Tan Tien Ping, USM logo visible

---

## SECTION 3 — Chatbot Tests

### Test 10 — Basic Chatbot Functionality
- Send a message in English — verify AI responds in English with Malay vocabulary
- Send a message in Malay — verify AI responds appropriately
- Verify response streams via SSE (not a single delayed response)
- Verify vocabulary pills appear for Malay words in response
- Verify VocabPills show meaning on hover

### Test 11 — Chatbot Memory & RAG
- Send a message, then ask a follow-up referencing the previous message — verify AI remembers context
- Verify RAG retrieves relevant Malay corpus chunks (check logs for similarity search hits)
- Verify conversation memory limited to last 10 messages

### Test 12 — Vocabulary & Grammar Extraction
- After chatbot session, check dashboard vocabulary table — verify new words added
- Check grammar_learned table — verify grammar rules extracted
- Send same word twice in different sessions — verify no duplicate in vocabulary_learned (case-insensitive dedup)

### Test 13 — Chatbot Rate Limiting
- Send 21 messages within 1 minute — verify 429 on the 21st request
- Wait 1 minute — verify requests accepted again

### Test 14 — Personalized Suggested Prompts
- Open chatbot as a user with weak points — verify suggested prompts reference those weak areas
- Open chatbot as a brand new user with no history — verify generic starter prompts shown
- Verify prompts are Gemini-generated, not hardcoded

### Test 15 — Chat History Page
- Navigate to /chatbot/history — verify all past sessions listed
- Verify session title shows first user message truncated to 60 chars
- Click a session — verify full conversation loads in read-only view
- Verify no input box shown in history view (read-only)

---

## SECTION 4 — Course Generator Tests

### Test 16 — Course Generation (Background)
- Submit a course topic — verify modal closes within 1 second
- Verify floating progress card appears bottom-right
- Verify progress bar updates every 3 seconds
- Verify "+ New Course" button is disabled while generation in progress
- Verify course appears in library when complete
- Verify "View Course" link appears on completion card
- Refresh browser mid-generation — verify progress card reappears and continues polling

### Test 17 — Content Filter
- Submit an appropriate topic (e.g. "ordering food") — verify course generates
- Submit an inappropriate topic (e.g. offensive content) — verify 400 rejection before generation starts
- Verify filter runs server-side (cannot be bypassed from frontend)

### Test 18 — Course Structure & Content
- Generate a course and verify structure: Course → Modules → Classes
- Verify each class has: title, content in English, Malay vocabulary with IPA
- Verify vocabulary saved to vocabulary_learned on class completion
- Verify course cover image generated and displayed on course card

### Test 19 — Module Locking
- Complete all classes in Module 1 — verify Module 1 quiz becomes available
- Attempt to access Module 2 before passing Module 1 quiz — verify locked
- Pass Module 1 quiz — verify Module 2 unlocks

### Test 20 — Course Persistence
- Generate a course, close browser, reopen — verify course still in library
- Mark several classes complete — verify progress persists after page refresh
- Delete a course — verify cascade deletes modules, classes, progress records

---

## SECTION 5 — Quiz Tests

### Test 21 — Module Quiz
- Complete all classes in a module — verify quiz auto-generated
- Verify quiz has 10 questions: 6 MCQ + 4 fill-in-blank
- Submit quiz with score < 70% — verify next module stays locked
- Submit quiz with score ≥ 70% — verify next module unlocks
- Verify wrong answers update weak_points table
- Verify quiz cached in Redis (second GET should not regenerate)

### Test 22 — Module Quiz Results Page
- Complete module quiz — verify results page shows score
- Verify per-question breakdown shown (correct/incorrect + explanation)
- Score ≥ 70%: verify "Continue to Next Module" button shown
- Score < 70%: verify "Retry Quiz" button shown

### Test 23 — Standalone Adaptive Quiz
- Take adaptive quiz as user with weak points — verify questions target those weak areas
- Take adaptive quiz as brand new user with no history — verify cold start fallback (general questions)
- Verify 15 questions: 6 MCQ + 6 fill-in-blank + 3 translation
- Submit quiz — verify BPS level recalculated from last 3 attempts
- Verify score saved to standalone_quiz_attempts table

### Test 24 — BPS Level Calculation
- Submit 3 quiz attempts all scoring < 40% — verify BPS-1 assigned
- Submit 3 attempts averaging 40–59% — verify BPS-2 assigned
- Submit 3 attempts averaging 60–79% — verify BPS-3 assigned
- Submit 3 attempts averaging ≥ 80% — verify BPS-4 assigned
- Verify BPS level displayed correctly on dashboard (no CEFR/A1/A2/B1/B2 labels anywhere)

### Test 25 — Evaluation Feedback Survey
- Complete any quiz — verify EvaluationFeedbackModal appears
- Submit feedback with all 3 fields — verify saved to evaluation_feedback table
- Complete another quiz in same session — verify modal does NOT appear again
- Verify feedback visible in admin panel /admin/feedback

---

## SECTION 6 — Dashboard Tests

### Test 26 — Dashboard Data Accuracy
- Complete 2 courses and 3 quizzes — verify stats cards show correct counts
- Check vocabulary table — verify all learned words listed with correct source tags
- Check grammar table — verify grammar rules listed
- Check weak points chart — verify weak areas shown with strength scores
- Check quiz history — verify all attempts listed with scores and pass/fail badges

### Test 27 — Dashboard Caching
- Load dashboard — note response time
- Load dashboard again within 5 minutes — verify Redis cache hit (faster response)
- Complete a new class — wait 5 minutes — verify dashboard updates with new data

### Test 28 — Streak & XP Display
- Complete a learning activity — verify XP awarded correctly (class=10, quiz=25, chat=5, spelling=2)
- Complete activities on 3 consecutive days — verify streak = 3
- Skip a day — verify streak resets to 0
- Verify streak and XP shown in sidebar and dashboard StatsCards

---

## SECTION 7 — Gamification Tests

### Test 29 — XP Awards
- Complete a course class — verify +10 XP in DB
- Pass a quiz — verify +25 XP in DB
- Send a chatbot message (session) — verify +5 XP in DB
- Get a spelling word correct — verify +2 XP in DB
- Verify XP total accumulates correctly across activities

### Test 30 — Streak Logic
- Complete any activity today — verify streak_count incremented
- Complete activity again same day — verify streak_count NOT double-incremented
- Complete activity on consecutive day — verify streak continues
- Miss a day — verify streak resets to 0 next activity

### Test 31 — Milestone Notifications
- Reach 3-day streak — verify notification created in notifications table
- Reach 7-day streak — verify notification created
- Reach 100 XP — verify notification created
- Advance BPS level — verify milestone card generated via image_service

---

## SECTION 8 — Notification Tests

### Test 32 — Notification Bell
- Trigger a streak milestone — verify unread count badge appears on bell icon
- Click bell — verify notification panel opens showing the notification
- Click notification — verify marked as read, badge count decreases
- Click "Mark all read" — verify all notifications marked read, badge disappears

### Test 33 — Notification Types
- Verify course generation complete notification appears when background job finishes
- Verify Journey weekly reminder notification created when user has active roadmap but no activity this week
- Verify BPS level-up notification appears when user advances proficiency level

---

## SECTION 9 — My Journey Tests

### Test 34 — Roadmap Generation
- Navigate to /journey with no active roadmap — verify empty state + goal form shown
- Select deadline (e.g. 6 months) and goal type (conversational) — submit
- Verify roadmap generated with phases → weeks → activities structure
- Verify roadmap saved to learning_roadmaps table as JSONB
- Verify banner image generated and displayed at top of roadmap
- Verify only one active roadmap per user (generating new one requires deleting old)

### Test 35 — Roadmap Personalization
- As BPS-1 user with vocabulary weak points — verify roadmap starts with beginner topics
- As BPS-3 user — verify roadmap skips basic phases and starts at intermediate topics
- Verify roadmap goal type affects content (survival vs academic vs conversational topics differ)

### Test 36 — Activity Deep Links
- Click a 'course' activity — verify navigates to /courses with topic pre-populated
- Click a 'quiz' activity — verify navigates to /quiz/adaptive
- Click a 'chatbot' activity — verify navigates to /chatbot with suggested prompt pre-filled
- Complete an activity — verify checkmark appears on activity card

### Test 37 — Roadmap Deletion
- Click delete roadmap — verify confirmation dialog appears
- Confirm deletion — verify roadmap removed from DB, empty state shown
- Verify roadmap_activity_completions also deleted for that user
- Generate new roadmap after deletion — verify works correctly

---

## SECTION 10 — Spelling Game Tests

### Test 38 — Spelling Game Flow
- Navigate to /games/spelling — verify word loads from user's vocabulary_learned
- Verify pronunciation audio plays automatically on word load
- Type correct spelling — verify +2 XP awarded, celebration shown, next word loads after 1.5s
- Type incorrect spelling — verify correct spelling + IPA shown, retry option available
- Verify session score counter updates correctly throughout game

### Test 39 — Spelling Game Edge Cases
- Play spelling game as new user with 0 vocabulary learned — verify appropriate empty state message shown
- Verify words are not repeated within the same session until all words exhausted
- Verify personal best score saved to spelling_game_scores table

---

## SECTION 11 — Pronunciation Audio Tests

### Test 40 — SpeakerButton Functionality
- Click speaker icon on a vocab word in chatbot VocabPill — verify Malay word pronounced
- Click speaker icon in course class vocabulary section — verify pronunciation plays
- Click speaker icon in quiz explanation — verify pronunciation plays
- Click speaker icon in dashboard vocabulary table — verify pronunciation plays
- Click speaker icon in spelling game — verify pronunciation plays

### Test 41 — Pronunciation Fallback
- Simulate ms-MY voice unavailable — verify falls back to ms voice
- Simulate ms voice also unavailable — verify falls back to default browser voice
- Verify no error thrown when no voice available — silent fallback

---

## SECTION 12 — Admin Panel Tests

### Test 42 — Admin Access Control
- Login as regular user — verify /admin redirects to /dashboard
- Login as admin user — verify /admin loads correctly
- Call GET /api/admin/stats without admin role — expect 403
- Verify Admin sidebar link only visible to admin users

### Test 43 — Admin Stats
- Verify total user count matches users table row count
- Verify quiz pass rate calculated correctly from module_quiz_attempts
- Verify course generation count matches courses table row count
- Verify feedback count matches evaluation_feedback table row count

### Test 44 — Admin User Management
- View user list — verify all users shown with BPS level and last active date
- Deactivate a user — verify user cannot login after deactivation
- Verify deactivated user's JWT tokens rejected by backend

### Test 45 — Admin Feedback Viewer
- Submit evaluation feedback as a test user
- Login as admin — verify feedback appears in /admin/feedback
- Verify aggregate rating calculated correctly
- Verify open text comments displayed

---

## SECTION 13 — Image Generation Tests

### Test 46 — Course Cover Image
- Generate a new course — verify cover_image_url populated in courses table
- Verify cover image displayed on course library card
- Verify cover image displayed on course detail page header
- Generate same course topic again — verify new image generated (different course record)
- Verify existing course with URL does not regenerate image on page reload

### Test 47 — Journey Banner Image
- Create a new journey roadmap — verify banner_image_url populated in learning_roadmaps table
- Verify banner image displayed at top of RoadmapView
- Delete and recreate roadmap — verify new banner generated

### Test 48 — Milestone Card Image
- Advance BPS level (submit enough high-scoring quizzes) — verify milestone card image generated
- Verify image URL stored in notifications table for that milestone notification

---

## SECTION 14 — BPS System Tests

### Test 49 — BPS Labels Throughout App
- Check dashboard proficiency display — verify shows BPS-1/BPS-2/BPS-3/BPS-4 (not A1/A2/B1/B2)
- Check quiz results page — verify BPS label shown after recalculation
- Check onboarding — verify BPS terminology used if proficiency mentioned
- Check Journey roadmap generation — verify BPS level sent to Gemini prompt correctly
- Global search frontend codebase for 'CEFR', 'A1', 'A2', 'B1', 'B2' — verify none appear in user-facing strings

---

## SECTION 15 — Performance & Security Tests

### Test 50 — Rate Limiting
- Hit chatbot endpoint 21 times in 1 minute — verify 429 on 21st request
- Hit course generate endpoint 6 times in 1 hour — verify 429 on 6th request
- Verify rate limit headers returned in response (X-RateLimit-Remaining)

### Test 51 — Input Sanitization
- Submit course topic with SQL injection attempt — verify sanitized, no DB error
- Submit extremely long course topic (>500 chars) — verify 422 validation error
- Submit empty course topic — verify 422 validation error
- Submit XSS payload in chat message — verify sanitized in response

### Test 52 — Redis Graceful Degradation
- Stop Redis server — verify app continues working (no 500 errors)
- Verify quiz still generates (without cache)
- Verify dashboard still loads (without cache, slower but functional)
- Verify rate limiter falls back to in-memory mode

### Test 53 — Error Handling
- Simulate Gemini API failure (invalid API key temporarily) — verify user-friendly error message shown
- Simulate DB connection failure — verify 500 with clean error message, no stack trace exposed
- Navigate to non-existent course ID — verify 404 shown cleanly

### Test 54 — Mobile Responsiveness
- Test all pages on 375px viewport (iPhone SE): dashboard, chatbot, courses, quiz, journey, spelling game, admin, settings
- Verify no horizontal scroll on any page
- Verify sidebar collapses correctly on mobile
- Verify all buttons and inputs are tappable (min 44px touch target)

---

## SECTION 16 — End-to-End User Journey Test

### Test 55 — Complete New User Flow
Run this as a single end-to-end test simulating a real new user:
1. Register new account → verify onboarding modal appears
2. Complete onboarding (set native language + learning goal)
3. Navigate to My Journey → set 3-month conversational goal → verify roadmap generated
4. Click first course activity from roadmap → verify course topic pre-populated
5. Generate the course → verify background generation + floating progress card
6. Complete all classes in Module 1 → verify vocabulary learned + XP awarded
7. Take Module 1 quiz → verify result + module 2 unlocks
8. Open chatbot → verify personalized suggested prompts shown
9. Send 3 messages → verify vocab extracted and added to dashboard
10. Take standalone adaptive quiz → verify BPS level calculated
11. Play spelling game → verify words from learned vocabulary used
12. Check dashboard → verify all stats updated (courses, vocab, quiz history, streak, XP)
13. Check notifications → verify streak and XP milestone notifications present
14. Check /settings/about → verify credits page shows Sowan + Dr. Tan Tien Ping + USM logo
15. Login as admin → verify user appears in admin panel with correct BPS level and activity

---
