# ACME Salary Management

Web app for an HR Manager to manage salaries of ~10,000 employees across countries and answer "how do we pay people?".

- Requirements: `docs/REQUIREMENTS.md`
- Design and trade-offs: `docs/DESIGN.md`

**Stack:** Node.js + Express + TypeScript + SQLite (better-sqlite3) | React + Vite + TypeScript + Ant Design

## Run locally
Requires Node 20+.

```bash
# 1. Backend (http://localhost:4000)
cd backend
npm install
npm run seed      # 10,000 employees (idempotent, reproducible)
npm run dev

# 2. Frontend (http://localhost:5173), in a second terminal
cd frontend
npm install
npm run dev       # /api is proxied to the backend
```

## Tests
```bash
cd backend  && npm test    # 49 tests, ~2 s, in-memory SQLite
cd frontend && npm test    # 12 tests
```

## Configuration
| Where | Variable | Purpose |
|---|---|---|
| backend | `PORT`, `DB_PATH`, `CORS_ORIGIN` | Server port, SQLite file, allowed frontend origin |
| frontend | `VITE_API_URL` | Backend URL in production (empty in dev) |
