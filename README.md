# ACME Salary Management

**Live demo:** https://acme-salary-02fl.onrender.com/ |  **Demo video:** https://www.loom.com/share/74b2536ba16f4338ac402607611abd6d

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
cd backend  && npm test    # 53 tests, ~2 s, in-memory SQLite
cd frontend && npm test    # 12 tests
```

## Configuration
| Where | Variable | Purpose |
|---|---|---|
| backend | `PORT`, `DB_PATH`, `CORS_ORIGIN` | Server port, SQLite file, allowed frontend origin |
| frontend | `VITE_API_URL` | Backend URL in production (empty in dev) |

## Docker / deployment
```bash
docker build -t acme-salary . && docker run -p 4000:4000 acme-salary   # http://localhost:4000
```
One container serves the API and the built frontend, and seeds 10,000 employees on first boot. See `docs/DEPLOYMENT.md` (Render steps and trade-offs).

## Documentation
`docs/REQUIREMENTS.md` | `docs/DESIGN.md` | `docs/DEPLOYMENT.md` | `docs/AI_USAGE.md` | `docs/prompts/` | `docs/DEMO_SCRIPT.md`
