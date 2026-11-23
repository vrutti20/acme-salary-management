# Design Notes

## Stack
- **Backend:** Node.js 22, Express, TypeScript, better-sqlite3 (SQLite), zod (validation), Vitest + supertest
- **Frontend:** React (Vite, TypeScript), Ant Design, TanStack Query, Ant Design Charts

## Architecture
```
React + Ant Design
      | REST / JSON
Express routes -> services (business rules, stats) -> repositories -> SQLite
```
Layering keeps HTTP, business logic and persistence separate, so each part is unit-testable and SQLite can be swapped for Postgres by changing only the repository/engine.

## Data model: `employees`
id, full_name, email (unique), job_title, department, country, currency, salary_minor (int), salary_usd_minor (int, derived), hire_date, created_at, updated_at

Indexes: `country`, `department`, `job_title`, `(country, job_title)`, plus `email` unique.

## API
```
GET    /api/employees?search&country&department&job_title&sort&page&page_size
POST   /api/employees
GET    /api/employees/{id}
PUT    /api/employees/{id}
DELETE /api/employees/{id}
GET    /api/insights/by-country
GET    /api/insights/by-job-title?country=
GET    /api/insights/by-department
GET    /api/insights/distribution
GET    /api/meta/filters
```

## Trade-offs
| Decision | Chosen | Alternative | Reason |
|---|---|---|---|
| Database | SQLite | Postgres | 10k rows, zero setup, easy to deploy and test in memory. Repository layer allows migration. |
| Pagination / filtering | Server-side | Load all, filter in browser | Keeps payload small and UI fast. |
| Money | Integer minor units + currency | Float | Avoids rounding errors. |
| Median / stats | Computed in TypeScript from one lightweight query (`stats.ts`, pure functions) | SQL aggregates + window functions | SQLite has no native median. One code path for min/max/avg/median keeps it simple and unit-testable; 10k rows takes ~25 ms. |
| FX rates | Static config table | Live API | Deterministic and offline. |
| USD normalisation | Derived `salary_usd_minor` column written on create/update | Convert at query time | Makes sorting and aggregation by USD cheap and simple. Trade-off: changing FX rates needs a recompute (documented future work). |
| Currency | Derived from country | Free-form input | Currency and country can never disagree. |
| Validation | zod schemas at the HTTP boundary | Manual checks | Single source of truth for rules and error messages. |

## Performance
- Indexes on filter columns; pagination capped at 100 rows per page.
- USD value stored as a derived column; no per-row conversion at query time.
- Seed script uses bulk inserts in batches of 1,000.

### Measured (10,000 seeded employees, local, single request)
| Endpoint | Time |
|---|---|
| GET /api/employees (page of 25) | ~12 ms |
| GET /api/employees (search + filter + sort) | ~4 ms |
| GET /api/insights/by-country | ~25 ms |
| GET /api/insights/by-department | ~14 ms |
| GET /api/insights/distribution | ~9 ms |
| Seed script (10,000 rows) | ~170 ms |

All well inside the targets in REQUIREMENTS.md (300 ms / 500 ms).

## Testing strategy
- Unit: statistics (median, buckets), currency conversion, validation (49 tests, ~2 s total).
- API: in-memory SQLite, CRUD, filters, duplicate email, 404, invalid input.
- Insights: tiny fixed dataset with hand-computed expected values.
- Seed smoke test with a small count.
- Frontend: a few component tests (table, filters, form validation).

## Future improvements
Auth and roles, salary history/audit log, CSV import, live FX rates, Postgres, export to Excel.
