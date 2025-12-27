# DSA Mentor Feature Catalogue

## Landing & Public Experience
- Hero CTA with scroll-aware header, social-style navigation, and quick login entry point for new users.
- Public stats fetched from `/api/dashboard/public-stats`: total problems, unique topics, difficulty distribution, AI interview badge.
- Feature highlights: curated problem set (topics, difficulty, company tags), AI mentor, AI mock interviews, progress analytics, multi-language starter code, company-specific prep, streaks/achievements.
- Difficulty distribution cards (Easy/Medium/Hard), testimonials/about block, and footer with platform/resources/support links.
- Animated hero code window, theme toggle, and smooth scroll anchors for Features/Problems/About.

## Authentication & Access Control
- Email/password registration and login with role-aware redirect (superadmin → admin console, client → client dashboard).
- JWT-based auth with access/refresh tokens, refresh rotation, logout clears cookie; guard middleware `authenticate`, `checkPermission`, and `roleCheck` protect routes.
- Roles/permissions catalogue (system and custom) with categories: System, Problems, Solutions, Analytics, Reports, Users, Roles, Features. Permission examples: `read:problems`, `create:update:delete:problems`, `view:analytics`, `view:reports`, `manage:users`, `manage:roles`, `manage:settings`, `access:mentor`, `submit:solutions`.

## Client Experience
- **Career Tracks**: Browse curated learning pathways with category/difficulty filters and search. Enroll in tracks, unlock modules progressively, complete lessons, rate tracks. Premium flagging and detailed stats available. Endpoints under `/api/career-tracks` with full CRUD, enrollment tracking, and progress persistence. Frontend pages with module/lesson UI, progress bars, completion celebrations.
- **Leaderboard**: Global rankings with period filters (all-time/monthly/weekly) and category filters (problems/accuracy/interviews/streaks). Top 3 showcases for problem solvers, accuracy leaders, and current streakers. Personal position card with rank and nearby users. Topic-specific leaderboards available. Rising stars section highlighting recent improvers. Responsive podium displays with medals and achievement badges.
- **Dashboard**: Personal stats (problems solved, accuracy, streak, level, focus areas), recent problems, activity heatmap, quick actions to Practice/Interview/Analytics/Mentor, and interview banner with best/avg scores.
- **Practice Library**: Topic/difficulty filters, search, acceptance info, difficulty badges, topic tags, card grid; navigation into problem details.
- **Problem Detail**: Rich description, input/output formats, constraints, sample cases, hints, topics/companies, acceptance and attempts, starter code per JS/Python/Java/C++; run/submit now call backend executor (sample runs at `/problems/:slug/run`, full judging via `/problems/:slug/submit`) with per-test stdout/stderr surfaced.
- **AI Interview Flow** (100% Local Pattern-Matching AI):
  - **Setup**: Choose interview type (conversational/timed/mock), difficulty/mixed, topics multiselect, duration, question count; creates session via `/interview/create`.
  - **Live Session**: Chat with local AI interviewer using pattern-matching and intent detection, request hints with context-aware responses, code editor with language switcher, run code against sample/visible cases using local sandbox, submit per question for full judging, timer, mobile tabs.
  - **Completion**: Auto end or manual end → results page with overall score, metrics (accuracy, questions solved, time, hints), breakdown per competency, per-question feedback with local complexity analysis, strengths/improvements from code structure analysis, recommendations, retake/back actions.
  - **History/Stats**: `/interview/history` and `/interview/stats` for totals, averages, best score, topic distribution.
- **Analytics**: User-level stats cards, interview performance + topic distribution, focus areas; upcoming advanced analytics section.
- **Achievements**: Definitions + user progress with filters (all/unlocked/locked/Practice/Progress), badge counts (bronze/silver/gold/platinum), progress bars; data from `/achievements/user`; **auto-unlocks** on problem solve, interview completion, and career track/lesson completion (Track Starter, Track Master, Dedicated Learner badges).
- **AI Mentor**: Chat-style UI with quick questions; response stub noting integration coming soon.
- **Settings**: Profile (bio, phone, social links, skills, experience, education), profile picture upload/delete, resume PDF upload & parsing to auto-fill fields, theme toggle (light/dark), language preference, notifications, daily reminders, password update form placeholder; preferences persisted locally.
- **Client Shells/Layout**: Responsive sidebar/header, streak chip, logout, page-level loaders and skeletons for perceived performance.
- **Activity Heatmap**: Fed by `/dashboard/activity-graph` (52-week grid with intensity legend).
- **Interview Tips**: Panel on setup page; mobile tabbed chat/editor in live session; code/editor language switch persists per question.

## Mentor Experience (B2B Bootcamp Business Model)
- **Mentor Role**: Dedicated role in User model enabling bootcamp instructors to manage student rosters and track progress.
- **Mentor Dashboard**: Overview with total students, active students, average problems solved, and average accuracy. Tabbed interface for Overview/Students/Assignments.
- **Student Management**: Add students by email, remove from roster, view detailed progress including solved problems by difficulty/topic, career track enrollments, achievement unlocks.
- **Assignment Features**: Assign career tracks to multiple students simultaneously. Assign specific problem sets with optional due dates. Track completion and performance across all students.
- **Student Comparison**: Side-by-side comparison of all students ranked by problems solved, accuracy, current streak, and interviews completed.
- **Progress Monitoring**: Detailed per-student view showing problem-solving statistics, track progression, interview completion, and achievement milestones.
- **API Endpoints**: `/api/mentor/dashboard`, `/api/mentor/students`, `/api/mentor/students/:id/progress`, `/api/mentor/assign-track`, `/api/mentor/assign-problems`, `/api/mentor/students/comparison`.
- **Permissions**: `mentor:students` for roster management, `mentor:assignments` for assigning work. Configured in roles system.

## Superadmin / Admin Experience
- Admin dashboard: platform stats (total users, client vs superadmin, active 24h, avg problems solved/accuracy), quick actions (users, problems, reports, settings), and recent activity feed (registrations, completed interviews) from `/dashboard/recent-activity`.
- User management: list/search/filter by role, create/edit/delete users (permission-guarded), set role, view problems solved, accuracy, level, join date.
- Roles & permissions: fetch permissions, list roles with user counts, create/edit/delete roles (system roles protected), color tags, modal form validation, per-permission toggles including `all`; new permissions for career tracks (`create:tracks`, `update:tracks`, `delete:tracks`) and mentor workflows (`mentor:students`, `mentor:assignments`).
- Problem management: full CRUD with description, difficulty, topics/companies, constraints, input/output formats, hints, sample + hidden tests, starter code per language, active flag; search and status badges.
- Platform analytics: DAU/WAU/MAU, growth (last 30d), problem/interview/submission stats, success rate, topic popularity, performance distribution, system health (API/db responsiveness, uptime, connections), CSV export.
- Reports: selectable report types (user activity, problem performance, system usage, user progress/top performers), in-app tables/cards and CSV export; PDF download placeholder.
- Admin settings: tabbed general/security/email/database/advanced; maintenance mode, registration toggle, push/email prefs, digest cadence, 2FA toggle placeholder, session timeout, database stats (size, collections, record counts), backup trigger (placeholder), restore placeholder, advanced guidance.
- Superadmin shell/nav with PermissionGuard; route protection enforced in UI and API permissions.

## Shared / Platform Services (Backend)
- Problems API: list/filter/search/paginate; stats endpoint; get by slug; sample run via `/problems/:slug/run`; submit with real executor, scoring, and sanitized per-test results; admin list plus create/update/delete; achievement checks trigger on successful solves.
- Interview API: create session, get session, chat message, run code against sample/visible cases, submit per question with executor-backed judging plus scoring/feedback, hints, end session, results summary, history, stats; AI chat/feedback powered by OpenAI when `OPENAI_API_KEY` is present, with graceful keyword fallback.
- **Career Tracks API**: List tracks with filters/search/pagination, get by slug with enrollment progress, enroll users, complete lessons with module unlocking, rate tracks, get user's enrolled tracks. Admin CRUD (create/update/delete) and stats endpoints. Achievement triggers on track/lesson completion.
- **Leaderboard API**: Global leaderboard with period filters (all/weekly/monthly) and category filters (problems/accuracy/interviews/streaks). Topic-specific leaderboards with difficulty filtering. Personal position endpoint with nearby users. Stats endpoint for top performers, rising stars, and current streakers. Uses existing User model indexes for optimal performance.
- **Mentor API**: Dashboard overview with student roster and aggregate stats. Add/remove students by email. Get detailed student progress including problem stats by difficulty/topic, track progress, and achievements. Assign career tracks to multiple students. Assign problem sets with due dates. Student comparison endpoint for performance rankings.
- **Discussion Model**: Added schema with problem-linked threads, votes (upvotes/downvotes), nested replies, tags, hot/top/new/trending sorting algorithms. Vote tracking per user to prevent duplicates. Accepted answer marking. Flag system for moderation.
- **Discussion API**: Get discussions by problem with sorting (hot/top/new/trending), create discussions, vote on discussions and replies, add nested replies, mark answers as accepted, flag inappropriate content. Full CRUD operations. Routes registered at `/api/discussions`.
- **Interview API**: Create session, get session, chat message with local AI interviewer using pattern-matching, run code against sample/visible cases using local sandbox, submit per question with local code execution + scoring/feedback, hints with context-aware templates, end session, results summary with local code analysis, history, stats; AI responses contextual using intent detection and knowledge base.
- **Achievements API**: Definitions and user progress, badge tracking, unlock logic (problems solved, streaks, interviews, speed/accuracy, time-of-day, career tracks). **Auto-trigger system** that checks and unlocks achievements on problem submission, interview completion, and track/lesson completion. 15 total achievements including 3 track-specific badges.
- Reports API: protected by `view:reports`, generates user-activity, problem-performance, system-usage, and user-progress datasets.
- Dashboard API: client stats, superadmin stats/user list, public landing stats, activity graph, recent activity feed.
- Admin settings API: get/update settings, backup/restore placeholders; returns DB stats.
- Auth/profile API: register/login/refresh/logout, admin user CRUD, current profile, update own profile, resume upload/parse, profile picture upload/delete; permissions derived from roles.
- Middleware: `authenticate` JWT guard, `checkPermission`, `roleCheck`; cache layer stub; file uploads via Multer (profiles/resumes) with validation; audit logger hook for actions.
- **Utilities**: Token utilities for access/refresh generation/verification; resume parser stub for PDF extraction; activity/metrics aggregates in controllers; **Local AI service** with pattern-matching intelligence supporting contextual interview chat (9 intent types), code feedback with structure analysis and quality scoring, complexity estimation, and interview summaries. Zero external dependencies - runs completely offline.
- **Scripts**: Seed roles, create/reset superadmin helpers for bootstrap; uploads storage folders (profiles/resumes).

## Technical Infrastructure - 100% Self-Hosted Architecture

### 🚀 Zero External Dependencies
**Complete Platform Independence** - No OpenAI API keys, no external code execution services, no third-party AI providers.

### Local AI System
- **Pattern-Matching Intelligence**: Rule-based AI using regex intent detection with 9 interview scenario patterns
- **Interview Knowledge Base**: Curated response templates for greetings, hints (data structures/algorithms/complexity/edge cases), encouragement, clarifications
- **Intent Detection**: Intelligent pattern matching for needsHint, needsClarification, needsApproach, seekingValidation, complexityQuestion, edgeCaseQuestion, dataStructureQuestion, greeting, general
- **Code Analysis Engine**: Local code structure examination detecting loops, conditionals, recursion, functions, data structures, comments, naming conventions
- **Complexity Estimation**: Algorithm-based Big O calculation from code patterns (nested loops → O(n²/n³), sorting → O(n log n), recursion → O(n), binary search → O(log n))
- **Score Calculation**: Pass rate + code quality bonuses (comments +5, naming +5, data structures +5)
- **Zero API Costs**: No monthly bills, unlimited usage, complete control over AI responses

### Local Code Execution Sandbox
- **Secure Native Execution**: Node.js child_process-based sandboxing with timeout controls and resource limits
- **Multi-Language Support**: JavaScript (Node.js), Python (python3), Java (javac + java), C++ (g++ compilation)
- **Security Features**: Isolated temp directories, 5-8 second timeout limits, 10MB output buffer caps, automatic cleanup
- **Compilation Pipeline**: Automatic compilation for Java/C++ with error handling, direct execution for interpreted languages
- **Test Judging**: Runs multiple test cases with stdin/stdout comparison, execution time tracking, exit code monitoring
- **No External APIs**: Eliminates dependency on Piston, Judge0, or other paid execution services

### Performance & Scale
- **Indexing & Performance**: User model indexed on `problemsSolved` and `accuracy` for fast leaderboard queries. Discussion model uses virtual fields for vote scoring and hot ranking algorithm.
- **Permissions System**: Extended with career track permissions (`create:tracks`, `update:tracks`, `delete:tracks`) and mentor permissions (`mentor:students`, `mentor:assignments`). Role-based access control throughout API.
- **User Roles**: Three primary roles - `client` (students), `mentor` (instructors), `superadmin` (platform administrators). Mentor role includes dedicated fields for organization, students array, specializations, experience, and verification status.
- **Rate Limiting**: API protection with 100 requests per 15 minutes. Auth endpoints limited to 10 attempts per 15 minutes with successful request skipping.
- **Compression**: gzip enabled reducing bandwidth by ~70% for large payloads.

### Cost Advantages
- **Zero Monthly API Bills**: No OpenAI GPT-4 charges ($0.03/1K tokens = $30-300/month for 1,000 users eliminated)
- **No Code Execution Fees**: Eliminated Judge0/Piston API costs
- **Predictable Infrastructure**: Only MongoDB + Node.js server costs, fully scalable on own terms
- **Free Tier Friendly**: Can run on single VPS without worrying about API overage charges

## Known Placeholders / Coming Soon
- PDF report generation and DB backup/restore require external services.
- Discussion frontend UI components (backend complete, UI in progress).
- Voice input/output for mock interviews.
- Admin UI for creating career tracks (API complete).
- Assignment tracking model for mentor-assigned problem sets.
- Achievement toast notifications on unlock.
- Real-time leaderboard updates via WebSockets.

## 🆕 NEW FEATURES - Quick Wins Sprint

### Problem Frequency Crowdsourcing (TIER 1)
**What We Beat**: LeetCode charges $99/year for company frequency data
- Users report which problems were asked in real interviews with company, date, round, position
- Automatic duplicate prevention (same user + company + problem within 30 days)
- Public frequency data showing "Asked 47 times by Google in last 90 days"
- Top companies list with visual bars, round distribution, recent interview timeline
- Frontend component with inline reporting form integrated into problem pages
- API Endpoints: `POST /api/problems/:slug/report-interview`, `GET /api/problems/:slug/frequency`
- Virtual fields: `recentFrequency`, `totalTimesAsked` calculated on-demand

### Interview Replay Analysis (TIER 3)
**What We Beat**: No platform offers session recording with AI-powered timeline analysis
- Complete interview session replay with timestamped timeline of messages, code submissions, hints
- AI-powered analysis generating critical moments, communication patterns, improvement areas
- Insights dashboard showing total messages, hints used, avg time per problem, score breakdown
- Endpoints: `GET /api/interview/replays` (list), `GET /api/interview/replay/:id` (timeline), `GET /api/interview/replay/:id/analysis` (AI analysis)
- Analysis caching in Interview model to avoid regenerating expensive AI calls
- Timeline includes: start/end events, user/AI messages with elapsed time, code submissions with results, hint requests

### Public Portfolio Generator (TIER 2)
**What We Beat**: No coding platform generates shareable public portfolios
- Public profile pages at `@username` URLs showcasing user stats, solved problems, achievements
- Statistics: problems solved, accuracy, streaks, level, interview scores
- Difficulty breakdown (Easy/Medium/Hard), topic mastery top 10, recent activity feed
- Social sharing buttons for LinkedIn/Twitter with pre-filled text
- Privacy toggle (public/private portfolio)
- JSON export for resume attachments or external use
- API Endpoints: `GET /api/portfolio/:username` (public), `GET /api/portfolio/me/link` (shareable URLs), `PUT /api/portfolio/me/visibility` (toggle), `GET /api/portfolio/me/export` (JSON download)
- User model field: `portfolioPublic` (boolean, default true)

**Free Marketing**: Users share portfolio links on resumes → drives organic traffic
