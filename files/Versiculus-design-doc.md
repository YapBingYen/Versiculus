# 🎨 Versiculus— Design Document

**Version:** 1.0\
**Date:** April 2026\
**Author:** Yap Bing Yen\
**Status:** Draft

***

## 1. Design Philosophy

Versiculus's design is guided by three core principles:

**1. Sacred but Playful** — The visual language should feel reverent enough to honor its source material (Scripture), while being warm, modern, and approachable. No cold or sterile academic aesthetics.

**2. Frictionless Focus** — Every screen exists to serve the puzzle. UI chrome is minimal. The game grid is the hero of every view.

**3. Mobile-First, Always** — The game is a 60-second daily ritual most often played on a phone during morning quiet time or a commute. Every component is designed at 375px first.

***

## 2. Brand Identity

### 2.1 Name & Logo Concept

**Versiculus** — a portmanteau of "Verse" (Scripture) and "-le" (nodding to the Wordle lineage).

**Logo:** A stylized open book whose right page contains a 4×4 grid of colored tiles (green, yellow, gray). Clean wordmark in the brand serif font beneath.

### 2.2 Color Palette

| Token                   | Hex       | Usage                                  |
| ----------------------- | --------- | -------------------------------------- |
| `--color-primary`       | `#2C5F8A` | Primary actions, links, brand accents  |
| `--color-primary-light` | `#4A90C4` | Hover states, subtle highlights        |
| `--color-correct`       | `#538D4E` | 🟩 Correct tile (matches Wordle green) |
| `--color-present`       | `#B59F3B` | 🟨 Present tile (matches Wordle gold)  |
| `--color-absent`        | `#3A3A3C` | ⬜ Absent tile (dark mode default)      |
| `--color-absent-light`  | `#787C7E` | Absent tile (light mode)               |
| `--color-tile-border`   | `#565758` | Empty tile border                      |
| `--color-bg`            | `#121213` | Page background (dark mode default)    |
| `--color-bg-light`      | `#FFFFFF` | Page background (light mode)           |
| `--color-surface`       | `#1A1A1B` | Modal / card surface (dark)            |
| `--color-text`          | `#FFFFFF` | Primary text (dark mode)               |
| `--color-text-muted`    | `#818384` | Secondary/helper text                  |
| `--color-gold-accent`   | `#C9A84C` | Streak highlights, achievement badges  |

### 2.3 Typography

| Role            | Font             | Weight | Size    |
| --------------- | ---------------- | ------ | ------- |
| Wordmark / Logo | Playfair Display | 700    | 28px    |
| Verse Reference | Playfair Display | 600    | 18px    |
| Verse Body Text | Lora             | 400    | 16px    |
| UI Labels       | Inter            | 500    | 14px    |
| Tile Letters    | Inter            | 700    | 20–24px |
| Stats Numbers   | Inter            | 700    | 32px    |
| Stats Labels    | Inter            | 400    | 12px    |
| Button Text     | Inter            | 600    | 16px    |

**Rationale:** Playfair Display and Lora are classical serif fonts that evoke Scripture and tradition. Inter provides clean, legible UI contrast.

### 2.4 Iconography

- Icon set: **Lucide Icons** (React-compatible, MIT license)
- Key icons used: `BookOpen`, `BarChart2`, `Share2`, `HelpCircle`, `Settings`, `X`, `Check`, `ChevronRight`

***

## 3. Layout & Grid System

### 3.1 Page Structure

```
┌──────────────────────────────────┐
│           HEADER BAR             │  48px height
├──────────────────────────────────┤
│                                  │
│         VERSE HEADER             │  Reference + pre-revealed text
│                                  │
├──────────────────────────────────┤
│                                  │
│          GAME GRID               │  6 rows × N columns (N = blank count)
│                                  │
├──────────────────────────────────┤
│                                  │
│       KEYBOARD / INPUT           │  On-screen keyboard or text input
│                                  │
└──────────────────────────────────┘
```

### 3.2 Breakpoints

| Breakpoint       | Width   | Notes                                              |
| ---------------- | ------- | -------------------------------------------------- |
| Mobile (default) | 375px   | Primary target; all components designed here first |
| Mobile L         | 430px   | Slight tile size increase                          |
| Tablet           | 768px   | Two-column layout consideration for stats          |
| Desktop          | 1024px+ | Game centered in 500px max-width container         |

### 3.3 Game Grid Specifications

- **Rows:** 6 (one per attempt)
- **Columns:** Variable — equal to the number of blanked words (typically 3–6)
- **Tile size:** 62×62px (desktop), 52×52px (mobile)
- **Tile gap:** 5px
- **Tile border radius:** 4px
- **Max grid width:** `min(100%, 420px)`

***

## 4. Screen-by-Screen Design

### 4.1 Header Bar

**Contents (left to right):**

- Help icon (❓) — opens How to Play modal
- App title: **VERSE-LE** (centered, wordmark)
- Stats icon (📊) + Settings icon (⚙️) — right-aligned

**Behavior:** Sticky; a bottom border appears on scroll.

***

### 4.2 Verse Header

Displayed above the game grid. Shows:

1. **Verse Reference** in Playfair Display (e.g., *John 3:16*)
2. **Masked Verse Text** — the full verse with blank slots represented by underscored input areas.

Pre-revealed words are rendered in plain text. Blank positions are shown as styled placeholder tiles that correspond 1:1 with the game grid columns.

**Example (masked):**

> "For God so loved the **\[\_\_\_\_\_]**, that he gave his one and only **\[\_\_\_\_\_]**, that whoever **\[\_\_\_\_\_]** in him shall not **\[\_\_\_\_\_]** but have eternal life."
> — John 3:16

***

### 4.3 Game Grid

Each row represents one attempt. Each cell within a row represents one guessed word for the corresponding blank.

**Tile States:**

| State               | Style                                               |
| ------------------- | --------------------------------------------------- |
| Empty               | White/dark bg, colored border `--color-tile-border` |
| Filled (pre-submit) | White/dark bg, brighter border                      |
| Correct 🟩          | `--color-correct` background, white bold text       |
| Present 🟨          | `--color-present` background, white bold text       |
| Absent ⬜            | `--color-absent` background, white text             |

**Animations:**

- **Flip animation:** On row submission, tiles flip vertically (180° Y-axis) to reveal feedback color. Duration: 300ms per tile, staggered by 100ms.
- **Bounce animation:** On win, the correct row tiles do a small vertical bounce.
- **Shake animation:** On invalid guess (e.g., empty input), the active row shakes horizontally.
- **Pop animation:** Each keypress causes the active tile to briefly scale up (1.0 → 1.12 → 1.0) over 100ms.

***

### 4.4 Input Method

Two modes are supported:

**Option A — Word-by-Word Input (Recommended for V1)**

- A single text input field appears below the grid.
- The user types the word for the currently focused blank, then presses Enter or Tab to move to the next blank.
- Active blank is highlighted in the grid with a glowing border.
- A row "Submit" button appears after all blanks are filled.

**Option B — Custom On-Screen Keyboard**

- A QWERTY keyboard is rendered below the grid.
- Letter keys are colored based on their best result across all guesses (green > yellow > gray).
- A backspace key and Enter key are included.
- Words are entered one at a time, confirmed with Enter, then auto-advance to next blank.

**V1 ships with Option A.** Option B is a V2 enhancement for a fully native-feeling mobile experience.

***

### 4.5 Toast Notifications

Ephemeral messages that appear centered at the top of the game area for 1.5 seconds:

| Trigger               | Message                                                   |
| --------------------- | --------------------------------------------------------- |
| Invalid / empty guess | "Not enough letters"                                      |
| Correct answer        | "🙌 Magnificent!" / "Well done!" / "Got it!" (randomized) |
| Game lost             | Full correct verse reference displayed                    |
| Copied to clipboard   | "Result copied to clipboard!"                             |

***

### 4.6 How to Play Modal

Triggered by the ❓ icon. Displays:

1. A short explanation paragraph.
2. Three example tile rows demonstrating Green, Yellow, and Gray.
3. A note about the verse source (NIV).
4. A "Got It!" dismiss button.

***

### 4.7 Statistics Modal

Triggered by the 📊 icon. Displays:

**Stats Row:**

```
  42          71%         5          12
Played    Win Rate   Current    Max Streak
                     Streak
```

**Guess Distribution Bar Chart:**

- Horizontal bars, one per attempt number (1–6).
- Bar length is proportional to number of wins at that attempt.
- The current game's row is highlighted in green if a win.

**Share Button:** Large, full-width. Only active after game completion.

**Next Puzzle Countdown:** `HH:MM:SS` countdown to the next day's puzzle reset.

***

### 4.8 End State Overlay (Win / Lose)

After game completion, a bottom sheet / modal reveals:

**Win State:**

- 🎉 Animated confetti or subtle sparkle.
- "You got it in X/6!" message.
- Full verse text revealed with reference.
- Share button + Stats button.

**Lose State:**

- Full correct verse revealed with reference.
- Encouragement copy: *"Keep reading. Try again tomorrow!"*
- Share button + Stats button.

***

## 5. Component Library

### 5.1 Tile Component

```
Props:
  letter: string       — Word to display inside tile
  state: 'empty' | 'filled' | 'correct' | 'present' | 'absent'
  animationDelay: number  — ms delay for flip animation stagger
```

### 5.2 Row Component

```
Props:
  tiles: Tile[]        — Array of tile data for this row
  isActive: boolean    — Whether this is the currently active row
  animate: boolean     — Trigger flip animation on this row
```

### 5.3 GameGrid Component

```
Props:
  guesses: Guess[]     — All submitted guesses
  feedback: Feedback[] — Corresponding feedback arrays
  currentGuess: string[]  — Words in the active, not-yet-submitted row
  blankCount: number   — Number of blanked words in verse
```

### 5.4 StatsBar Component

```
Props:
  value: number        — Count for this guess number
  maxValue: number     — Highest count (for relative bar width)
  guessNumber: number  — 1–6
  isCurrentGame: boolean  — Highlight this bar
```

### 5.5 Button Component (Variants)

- `primary` — Filled blue background, white text
- `share` — Filled green, white text, Share2 icon
- `ghost` — Transparent, border only
- `icon` — Icon-only, no label, circular hit area

***

## 6. Motion & Animation Spec

| Animation         | Element            | Type                  | Duration        | Easing                        |
| ----------------- | ------------------ | --------------------- | --------------- | ----------------------------- |
| Tile flip         | Game tile          | CSS transform rotateY | 300ms           | ease-in-out                   |
| Tile flip stagger | Row tiles          | CSS animation-delay   | +100ms per tile | —                             |
| Win bounce        | Correct row tiles  | translateY(-20px) → 0 | 400ms           | cubic-bezier(.36,.07,.19,.97) |
| Invalid shake     | Active row         | translateX ±8px × 3   | 500ms           | ease                          |
| Key press pop     | Active tile        | scale 1 → 1.12 → 1    | 100ms           | ease-out                      |
| Toast fade        | Toast notification | opacity 0→1→0         | 1500ms          | ease                          |
| Modal slide       | Bottom sheet       | translateY 100%→0     | 250ms           | ease-out                      |

***

## 7. Accessibility

- All interactive elements are keyboard-focusable with visible `:focus-visible` ring.
- Tile colors are supplemented with ARIA labels (e.g., `aria-label="faith: correct"`).
- Color feedback is not the *only* signal — tile position and ARIA labels provide text alternatives.
- Minimum touch target size: 44×44px (per WCAG 2.1 AA).
- Font size never below 14px.
- Dark mode is the default; a light mode toggle is available in Settings.

***

## 8. Dark Mode / Light Mode

**Default:** Dark mode (consistent with Wordle and the primary mobile use case).

**Toggle:** Accessible from the ⚙️ Settings icon. Preference stored in `localStorage`.

Dark mode uses the deep `#121213` background with light text. Light mode inverts to white background with dark text, and the absent tile becomes `#787C7E` (lighter gray).

***

## 9. Responsive Design Decisions

| Decision                                                     | Rationale                                                               |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Tile font scales with viewport                               | Prevents text overflow on narrow screens with long words                |
| On-screen keyboard in V2 only                                | Reduces V1 complexity; browser keyboard works fine for typed-word input |
| Stats modal is full-width on mobile                          | Bottom sheet pattern > centered dialog on narrow screens                |
| Verse text truncates to 2 lines with "See full verse" expand | Prevents the masked verse pushing the grid below the fold               |
| Max grid width 420px centered                                | Prevents tiles from becoming uncomfortably large on desktop             |

***

## 10. File & Component Structure

```
versiculus/
├── app/
│   ├── page.tsx              — Main game page
│   ├── layout.tsx            — Root layout, font loading
│   └── globals.css           — CSS variables, reset
├── components/
│   ├── game/
│   │   ├── GameGrid.tsx
│   │   ├── GameRow.tsx
│   │   ├── GameTile.tsx
│   │   └── VerseHeader.tsx
│   ├── input/
│   │   ├── WordInput.tsx     — Text-based word input (V1)
│   │   └── Keyboard.tsx      — On-screen keyboard (V2)
│   ├── modals/
│   │   ├── HowToPlayModal.tsx
│   │   ├── StatsModal.tsx
│   │   └── EndStateModal.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Toast.tsx
│   │   ├── StatsBar.tsx
│   │   └── Countdown.tsx
│   └── layout/
│       └── Header.tsx
├── lib/
│   ├── normalize.ts          — Normalization engine
│   ├── localStorage.ts       — State persistence helpers
│   └── shareGrid.ts          — Emoji grid generator
├── hooks/
│   ├── useGame.ts            — Core game state hook
│   └── useStats.ts           — Stats read/write hook
└── types/
    └── game.ts               — TypeScript interfaces
```

***

## 11. Design Handoff Checklist

- [ ] Figma file with all screens in mobile (375px) and desktop (1280px)
- [ ] Component variants documented (tile states, button variants)
- [ ] Motion spec reviewed and approved
- [ ] Color tokens exported and matched to `globals.css` CSS variables
- [ ] Accessibility audit completed (contrast ratios ≥ 4.5:1 for normal text)
- [ ] Dark and light mode screens both present in Figma
- [ ] Empty, loading, error, and success states all designed
- [ ] Share output formatted and reviewed for all completion scenarios

