# 📖 Versiculus — Product Requirements Document (PRD)

**Version:** 1.0\
**Date:** April 2026\
**Author:** Yap Bing Yen\
**Status:** Draft

***

## 1. Executive Summary

Versiculus is a daily web-based word puzzle game inspired by Wordle, purpose-built for Scripture memorization and engagement using the NIV Bible. Players are presented with a Bible verse containing blanked-out words and must guess the missing words within six attempts. Color-coded feedback guides each guess, and a shareable emoji grid lets players celebrate completions on social media — without spoiling the verse.

The core thesis is simple: gamification lowers the barrier to consistent Scripture engagement, turning a daily devotional habit into something fun, social, and rewarding.

***

## 2. Problem Statement

Consistent Bible memorization is a known challenge for many Christians. Existing tools — flashcard apps, devotional apps, reading plans — are largely passive and lack the "just one more game" engagement loop that makes daily habits stick. There is no dedicated product that combines the viral, social mechanics of modern word games with the goal of Scripture engagement.

**Versiculus fills that gap.**

***

## 3. Goals & Success Metrics

### 3.1 Product Goals

- Build a compelling daily habit loop around Scripture engagement.
- Make Bible memorization feel like play, not study.
- Achieve viral sharing through the emoji grid share mechanic.
- Demonstrate a professional, scalable full-stack architecture.

### 3.2 Key Performance Indicators (KPIs)

| Metric                                   | Target (3 months post-launch) |
| ---------------------------------------- | ----------------------------- |
| Daily Active Users (DAU)                 | 500+                          |
| Day-7 Retention                          | ≥ 30%                         |
| Share Rate (completions that are shared) | ≥ 15%                         |
| Average Session Length                   | 3–5 minutes                   |
| Win Rate                                 | 60–75%                        |

***

## 4. Target Audience

### Primary User

- **Christian students and young adults** (ages 16–30) in Malaysia and the wider Southeast Asia region, particularly the Shah Alam/Subang Jaya/Petaling Jaya corridor.
- Casual mobile-first users who already play daily word games (Wordle, Connections).
- Church small groups and youth ministries looking for engaging icebreakers.

### Secondary User

- Bible study leaders who want a low-friction tool to encourage verse familiarity.
- Diaspora Christians who want a shared daily ritual with their community.

***

## 5. User Stories

| ID    | As a…              | I want to…                                    | So that…                                       |
| ----- | ------------------ | --------------------------------------------- | ---------------------------------------------- |
| US-01 | Daily player       | See a new verse puzzle every 24 hours         | I have a fresh challenge each morning          |
| US-02 | Daily player       | Input word guesses into a grid                | I can interact with the puzzle                 |
| US-03 | Daily player       | Receive color-coded feedback per guess        | I can refine my next guess strategically       |
| US-04 | Daily player       | Share my result as an emoji grid              | I can show friends without spoiling the answer |
| US-05 | Returning player   | Have my progress saved if I close the browser | I don't lose my game mid-puzzle                |
| US-06 | Competitive player | Track my win streak and statistics            | I feel rewarded for consistent play            |
| US-07 | Admin/Developer    | Seed the database with a verse schedule       | New puzzles are served automatically each day  |
| US-08 | New player         | See a clear tutorial or example               | I understand how to play on my first visit     |

***

## 6. Functional Requirements

### 6.1 Core Game Loop

**FR-01: Daily Verse Selection**

- One verse is designated as the puzzle for each calendar day.
- The verse is selected from a pre-seeded PostgreSQL database.
- The verse resets at midnight (UTC+8 / Malaysia Standard Time).

**FR-02: Verse Masking**

- A subset of "key words" in the verse are blanked out and presented as input tiles.
- Non-key words (articles, prepositions, conjunctions — e.g., "the", "and", "of") are pre-revealed to reduce trivial guesses.
- The number of blank tiles matches the number of guessable words.

**FR-03: Guess Input**

- Users type a word into an input field or on-screen keyboard.
- Each guess is submitted as a complete set of words (one word per blank tile).
- Exactly 6 attempts are allowed.

**FR-04: Normalization Engine**

- All guesses are normalized before comparison:
  - Lowercased
  - Punctuation stripped (commas, periods, exclamation marks, colons)
  - Leading/trailing whitespace trimmed
- Example: `"Faith,"`, `"FAITH"`, and `"faith."` all evaluate as `faith`.

**FR-05: Color-Coded Feedback**

| Color     | Meaning                                                |
| --------- | ------------------------------------------------------ |
| 🟩 Green  | Correct word in the correct position                   |
| 🟨 Yellow | Word appears in the verse but is in the wrong position |
| ⬜ Gray    | Word does not appear in the verse at all               |

**FR-06: Win / Lose State**

- Win: All blanks are filled with correct words.
- Lose: 6 incorrect or incomplete attempts have been used.
- On both outcomes, the full correct verse is revealed.

**FR-07: Share Mechanic**

- On game completion, a "Share" button generates a clipboard-ready emoji grid.
- The grid includes: game title, attempt number, and the colored emoji rows.
- No actual words are included in the share text (spoiler-free).

**Example share output:**

```
Versiculus 🗓️ Day 42
4/6

⬜🟨⬜⬜
🟩⬜🟨⬜
🟩🟩⬜🟨
🟩🟩🟩🟩

versele.app
```

### 6.2 State Persistence

**FR-08: LocalStorage Save State**

- Current game state (guesses made, feedback received, win/lose status) is saved to `localStorage` on every guess.
- On page load, the saved state is restored if it matches the current day's puzzle.
- State keys: `versele_date`, `versele_guesses`, `versele_status`.

### 6.3 Statistics & Streaks

**FR-09: User Stats Tracking**
The following stats are stored in the `user_stats` PostgreSQL table:

| Stat               | Description                              |
| ------------------ | ---------------------------------------- |
| Games Played       | Total number of completed games          |
| Win Percentage     | Percentage of games won                  |
| Current Streak     | Consecutive days with a completed puzzle |
| Max Streak         | All-time longest streak                  |
| Guess Distribution | Count of wins per attempt number (1–6)   |

**FR-10: Stats Modal**

- A "Stats" button opens an overlay displaying the user's statistics and guess distribution bar chart.

### 6.4 Tutorial / Onboarding

**FR-11: First-Run Tutorial**

- On the user's first visit (detected via `localStorage`), a brief animated tutorial overlay explains the color feedback system using a sample verse row.

***

## 7. Non-Functional Requirements

| Category        | Requirement                                                               |
| --------------- | ------------------------------------------------------------------------- |
| Performance     | Initial page load < 2 seconds on 4G mobile                                |
| Availability    | 99.5% uptime; daily puzzle must be available by 12:00 AM MYT              |
| Accessibility   | WCAG 2.1 AA compliance; keyboard-navigable game grid                      |
| Responsiveness  | Fully playable on 375px viewport (iPhone SE baseline)                     |
| Browser Support | Chrome, Safari, Firefox — latest 2 versions                               |
| Security        | No user PII collected without consent; no auth required for core gameplay |

***

## 8. Technical Architecture

### 8.1 Tech Stack

| Layer          | Technology                                   | Purpose                                              |
| -------------- | -------------------------------------------- | ---------------------------------------------------- |
| Frontend       | Next.js (React)                              | SSR + client-side state management for the game grid |
| Backend        | Node.js + Express                            | Game logic, normalization engine, API serving        |
| Database       | PostgreSQL                                   | Verse library, user stats, daily schedule            |
| Content Source | NIV Bible                                    | Pre-seeded into DB via a one-time import script      |
| Hosting        | Vercel (frontend) + Railway/Render (backend) | Scalable, low-cost deployment                        |
| State (client) | localStorage                                 | In-browser game state persistence                    |

### 8.2 Database Schema (Key Tables)

**`verses`**

```sql
CREATE TABLE verses (
  id          SERIAL PRIMARY KEY,
  reference   VARCHAR(50) NOT NULL,       -- e.g., "John 3:16"
  full_text   TEXT NOT NULL,              -- Full NIV verse text
  key_words   TEXT[] NOT NULL,            -- Array of blanked-out words
  difficulty  SMALLINT DEFAULT 1,         -- 1=Easy, 2=Medium, 3=Hard
  last_used   DATE
);
```

**`daily_schedule`**

```sql
CREATE TABLE daily_schedule (
  play_date   DATE PRIMARY KEY,
  verse_id    INT REFERENCES verses(id)
);
```

**`user_stats`**

```sql
CREATE TABLE user_stats (
  user_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  games_played      INT DEFAULT 0,
  games_won         INT DEFAULT 0,
  current_streak    INT DEFAULT 0,
  max_streak        INT DEFAULT 0,
  last_played_date  DATE,
  guess_distribution JSONB DEFAULT '{}'  -- e.g., {"1":0,"2":3,"3":5,...}
);
```

### 8.3 API Endpoints

| Method | Endpoint             | Description                                   |
| ------ | -------------------- | --------------------------------------------- |
| GET    | `/api/daily`         | Returns today's masked verse and metadata     |
| POST   | `/api/guess`         | Accepts a guess array; returns feedback array |
| GET    | `/api/stats/:userId` | Returns user statistics                       |
| POST   | `/api/stats/:userId` | Updates user statistics after game completion |

***

## 9. Out of Scope (V1)

The following features are explicitly deferred to post-launch iterations:

- User authentication / account creation
- Semantic scoring ("Messiah" ≈ "Christ")
- Hard Mode / Difficulty Tiers
- Social leaderboards
- Push notifications
- Bible translation choices (ESV, KJV, etc.)
- Admin CMS for verse scheduling

***

## 10. Future Roadmap

### V2 (Months 2–4)

- Anonymous user accounts via email or Google SSO
- Hard Mode: longer verses, more blanks
- Verse-of-the-week challenge (themed verses by liturgical calendar)

### V3 (Months 5–8)

- AI Semantic Scoring using embeddings (e.g., "Messiah" accepted for "Christ")
- Friend Leaderboards — compare streaks within a contact group
- Church/Cell Group mode — group streaks and shared stats

### V4+

- iOS/Android wrapper (React Native or PWA push notifications)
- Multi-language support (Bahasa Malaysia NIV)
- API for church websites to embed the daily puzzle

***

## 11. Risks & Mitigations

| Risk                        | Likelihood | Impact | Mitigation                                                      |
| --------------------------- | ---------- | ------ | --------------------------------------------------------------- |
| NIV copyright restrictions  | Medium     | High   | Confirm Fair Use / API licensing; use ≤ 500-word verse snippets |
| Low D7 retention            | Medium     | High   | A/B test tutorial UX; add streak loss protection feature        |
| Database seeding errors     | Low        | Medium | Write and test seed script with validation checksums            |
| Mobile keyboard UX friction | Medium     | Medium | Implement custom on-screen keyboard component                   |

***

## 12. Appendix

### A. Verse Selection Criteria (V1)

- Verses between 8–20 total words (manageable grid size)
- Minimum 3 and maximum 6 key words blanked out
- Priority: commonly memorized verses (John 3:16, Proverbs 3:5–6, Philippians 4:13, etc.)
- Initial seed: 365 verses (one full year's supply)

### B. Normalization Rules

1. `toLowerCase()`
2. `.replace(/[^a-z\s]/g, '')` — strip all non-alpha, non-space characters
3. `.trim()` — remove leading/trailing whitespace
4. Apostrophes in contractions are stripped: `"God's"` → `"gods"` (verse key words avoid contractions where possible)

