# ACME Salary Management

Web app for an HR Manager to manage salaries of ~10,000 employees across countries and answer "how do we pay people?".

See `docs/REQUIREMENTS.md` and `docs/DESIGN.md`.

## Backend (Node + SQLite)
```bash
cd backend
npm install
npm run seed      # 10,000 employees (idempotent, reproducible)
npm run dev       # http://localhost:4000
npm test          # fast, deterministic, in-memory SQLite
```
Env: `PORT`, `DB_PATH`, `CORS_ORIGIN`.
