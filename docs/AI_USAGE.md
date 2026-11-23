# How I used AI

> Draft: edit this in your own words before submitting. It must be true to what YOU did.

**Tool:** Claude (chat) used as a pair-programmer for planning, scaffolding and writing tests. I reviewed, ran and adjusted everything it produced.

## Workflow
1. **Plan first, code second.** I gave the assignment text and asked for requirements, scope, and architecture before any code. This produced `REQUIREMENTS.md` and `DESIGN.md`, which I reviewed and then committed first.
2. **Small, reviewable slices.** Backend domain logic, then API, then insights, then seed, then frontend, then deploy. Each slice was committed separately.
3. **Tests alongside code.** Pure logic (stats, currency, validation) has unit tests; API behaviour has tests on in-memory SQLite with hand-computed expected values.
4. **Verify by running, not by trusting.** I ran the test suites, seeded 10,000 rows, timed the endpoints, and ran backend + frontend together.

## Where AI output was wrong or needed a decision
| What happened | What I did |
|---|---|
| The installed `zod` was v4; generated code used v3 options (`errorMap`, `invalid_type_error`) and failed typechecking. | Fixed to the v4 API. Typecheck is part of my checks. |
| The compact USD formatter produced `$20.0K` instead of `$20K` (caught by a unit test). | Fixed the formatter, kept the test. |
| Initial plan had `currency` as free input. | Changed so currency is derived from country, so the two can never disagree. |
| Initial plan computed some aggregates in SQL. | Simplified to one tested pure `stats.ts` (SQLite has no median). |
| Plan suggested Vercel + separate backend. | Chose one Docker service: fewer moving parts. |

## How I checked correctness
- Backend: 53 tests, frontend: 12 tests, all fast and deterministic (in-memory DB, fixed seed, API mocked in UI tests).
- Insight numbers are verified against a tiny dataset where I calculated the expected values by hand.
- Measured latency on 10,000 rows (see `DESIGN.md`).
- Simulated the production build and checked `/`, `/api/*` and the 404 behaviour.

## What I did not delegate
- Deciding scope and what to leave out (`REQUIREMENTS.md`).
- Reviewing every file so I can explain it in the interview.
- [Add your own: anything you changed, rejected or added yourself.]

Prompts used are in `docs/prompts/`.
