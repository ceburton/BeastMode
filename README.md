# BeastMode — AP Psychology Study App

A polished, locally-running study tool that turns the **Beast Review** AP Psychology study sheet into a modern, evidence-based study app. Single-user, no auth, runs from a single `npm run dev`.

## Setup (cold start)

```bash
npm install        # install dependencies
npm run ingest     # parse "the Beast Review.md" into data/beast.db
npm run dev        # start the app at http://localhost:3000
```

That's it. All your progress lives at `data/beast.db` (SQLite). You can edit `the Beast Review.md` and re-run the ingest at any time, but **a re-ingest deletes the DB**, so export your progress first from `/settings` if you care to keep it.

Useful scripts:

| Command            | What it does                                                |
| ------------------ | ----------------------------------------------------------- |
| `npm run dev`      | Start the dev server                                        |
| `npm run build`    | Build for production                                        |
| `npm run start`    | Run the production build                                    |
| `npm run ingest`   | Re-parse the source markdown into SQLite + `data/beast.json`|
| `npm run typecheck`| TypeScript check (no emit)                                  |

## Feature tour

After you start the dev server, head to **http://localhost:3000**. Pages are also reachable via the top nav, and Cmd-K / Ctrl-K opens a fuzzy command palette.

### `/` — Dashboard

The home base. Shows: cards mastered (out of 646), cards due for review today, study streak, time studied this week, accuracy by unit (with color-coded bars), top 3 weakest units (clickable into a 10-question drill), and recent quiz attempts.

### `/flashcards` — Spaced-repetition deck

Self-grade with **Again / Hard / Good / Easy** (Anki style). Backed by a simplified **SM-2** algorithm in `lib/srs.ts`:

- New cards start with ease 2.5, interval 0.
- Again → interval 0 (re-show next session), ease −0.20, lapse +1.
- Hard → interval × 1.2, ease −0.15.
- Good → first time = 1d, second time = 6d, then interval × ease.
- Easy → bigger jump, ease +0.15.
- Ease is clamped to [1.3, 3.0]; max interval is 180 days.

Mnemonics are surfaced on the back of the card whenever they're attached to a term (e.g., **Hippocampus** → "if you saw a hippo on campus you'd remember it!").

Keyboard: **space** to flip, **1–4** to grade.

### `/quiz` — Practice quizzes (10 / 25 / 50 questions)

Pick units and a question count. The generator (`lib/quiz-gen.ts`) builds a 40 / 30 / 30 mix of:

- **Scenarios** (40%) — hand-authored stems from `lib/scenario-templates.ts`, e.g., "A driver buckles his seatbelt to make the annoying chime stop…" → Negative Reinforcement. ~37 templates spanning all 12 units.
- **Term → Definition** (30%) — "Which best describes _Dopamine_?"
- **Definition → Term** (30%) — definition stem, you pick the term.

Distractors are pulled from the **same topic first**, then same unit, then anywhere — so a question about Variable Ratio Schedule won't get distractors from social psych. Each question shows immediate feedback and a per-term explanation; an optional **confidence rating** (Guess / Unsure / Likely / Certain) feeds a calibration line on the results screen ("Avg confidence 90% vs accuracy 60% — overconfident").

End-of-quiz: review missed questions, and **Review missed (N)** spawns a fresh quiz of just the misses.

### `/exam` — Full timed practice exam

Mirrors the real AP format:

- Part I — 75 MCQ, 90-minute timer (top-right). Question grid lets you jump back to anything you skipped.
- 10-minute break screen with countdown (skippable).
- Part II — 1 Article Analysis Question + 1 Evidence-Based Question, 70-minute timer, free-text textarea.
- Submit → score report with **estimated AP score (1–5)** based on MCQ percentage, per-unit breakdown bars, suggested study focus drilling, and the FRQ rubrics + key concepts to self-grade against.

FRQs come from `lib/frq-content.ts` — 3 hand-authored AAQs and 3 hand-authored EBQs modeled on real AP scenarios (sleep & memory, online conformity, fear conditioning; chronic stress, depression biopsychosocial, eyewitness memory). Each comes with a 5-or-6-point rubric and a list of key concepts you should hit.

### `/guide` — Browseable study guide

All 646 terms organized by unit and topic, with collapsible sections, a fuzzy in-page search (matches term, definition, topic, unit, or mnemonic), term highlighting, and **Print** for a paper-friendly per-unit view. Mnemonics are surfaced inline as amber chips.

### `/recall` — Active recall

Pick a unit + topic, then type everything you remember in a textarea (no peeking). Submit and the app auto-marks any term whose name appears in your dump, then shows the actual content side-by-side so you can refine. End with a self-rating (Rough / Mixed / Strong) that updates SRS schedules for the topic's terms. This implements the testing effect — retrieval beats re-reading.

### `/match` — Term ↔ Definition memory game

Pick a unit, get 12 random pairs, match them as fast as you can against a timer. Misses count, best times persist in localStorage per unit.

### `/settings` — Backup, restore, reset

- **Export progress** → JSON file (works as a fallback git/cloud-sync mechanism).
- **Import progress** → load a previously-exported file.
- **Reset all progress** (destructive; source content is untouched).

## Modern study principles baked in

| Principle | Where it shows up |
| --- | --- |
| **Spaced repetition** | Flashcards SRS schedule, Recall mode also feeds it |
| **Active recall** | Recall mode, quizzes, flashcards self-grade |
| **Interleaving** | Quizzes mix question types (40/30/30 scenario / T→D / D→T) and pull from across the chosen units |
| **Testing effect** | "Review missed" automatically spawns a quiz of just the misses |
| **Distributed practice** | Streak counter on dashboard nudges daily use |
| **Elaborative encoding** | Mnemonics shown prominently on flashcards, in the guide, and in explanations |
| **Metacognition** | Confidence rating on each quiz answer + post-quiz calibration check |

## Project layout

```
app/                       # Next.js App Router routes
  api/                     # API routes
    data/                  # export / import / reset progress
    exam/                  # GET exam, POST submission
    quiz/                  # POST generate, PUT submit
    recall/                # POST recall result
    search/                # GET all terms (for command palette + guide)
    srs/                   # GET deck, POST grade
    match/                 # POST match game completion
  layout.tsx               # global shell + theme
  page.tsx                 # dashboard
  flashcards/
  quiz/                    # uses a Suspense'd client component for searchParams
  exam/
  guide/                   # SSR'd shell + client search/expand
  recall/
  match/
  settings/

lib/
  db.ts                    # better-sqlite3 connection + schema (HMR-safe)
  srs.ts                   # SM-2 scheduling + deck queries
  quiz-gen.ts              # quiz + exam generator (40/30/30 mix)
  scenario-templates.ts    # ~37 hand-authored scenario stems
  frq-content.ts           # 3 AAQs + 3 EBQs with rubrics
  source.ts                # read source content (units, topics, terms)
  stats.ts                 # dashboard stats, attempt logging
  units.ts                 # unit metadata
  types.ts                 # shared types
  utils.ts                 # cn, formatDuration, shuffle, etc.

components/
  ui/                      # shadcn-style primitives (button, card, badge, ...)
  command-palette.tsx      # Cmd-K palette (powered by fuse.js)
  flashcard.tsx (inline in /flashcards)
  nav.tsx, nav-with-search.tsx, theme-toggle.tsx, theme-provider.tsx
  unit-picker.tsx, progress-ring.tsx

scripts/
  ingest.ts                # one-time markdown -> SQLite ingestion

data/                      # generated by `npm run ingest`
  beast.db                 # SQLite — source content + your progress
  beast.json               # human-inspectable dump of parsed cards
```

## Tech & design notes

- **Next.js 14 App Router + TypeScript**, **Tailwind**, **shadcn-style** components hand-authored for the few primitives needed (Button, Card, Badge, Input, Textarea, Progress, Select, Checkbox, Dialog) — keeps deps lean.
- **better-sqlite3** for fully synchronous, embedded persistence. Singleton DB connection guarded with a `globalThis` cache so HMR doesn't leak handles. All routes that touch the DB pin `runtime = 'nodejs'`.
- **Zustand** is in `package.json` but not used — Zustand-class state turned out to all fit cleanly in `useState` per page. Easy to introduce later for cross-page deck or quiz state.
- **Fuse.js** for fuzzy search in the command palette and guide.
- **next-themes** for dark/light, defaulted to dark. Toggle in the top nav.
- **No mocks, no placeholders**: every flashcard, quiz question, and study guide entry is generated from `the Beast Review.md`. The 7-row "Perspectives on Disorders" table from the source is also injected as cards.

## What was changed from the source

- Image placeholders (`[image1]`–`[image40]`), Google-Docs backslash escapes, and bold markers are stripped.
- Section "AP Exam Formatting" is treated as metadata, not cards.
- Some sentences that were really commentary (not term/definition pairs) are filtered by length heuristics.
- A small number of mnemonics from the source ("glutes excite you", "hippo on campus", "you betta be awake", etc.) are detected by parenthetical pattern matching and stored on the term as a separate field, not embedded in the definition.

## Where to click first

1. Run `npm run dev`.
2. Open **http://localhost:3000**.
3. From the dashboard, click **Practice Quiz** under Quick start, leave units on All, choose 10 questions, and run through one — you'll see scenarios, term-to-def, and def-to-term mixed in.
4. After the quiz, hit **Review missed** if any to see the per-miss breakdown, or head to **Flashcards → Due today** to start building your SRS schedule.
5. Try **Cmd-K** anywhere to fuzzy-search across units, topics, and 600+ terms.

Have at it. Beast mode engaged.
