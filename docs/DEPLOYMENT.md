# Deployment

One Docker web service serves both the API and the built React app (same origin, one URL, no CORS).

## Why this shape
| Decision | Reason |
|---|---|
| Single service instead of Vercel + separate API | One deploy, one URL, nothing to misconfigure. Fewer moving parts for a demo. |
| SQLite on the container disk | Matches the assignment. 10k rows is small. |
| Auto-seed on boot when the table is empty (`AUTO_SEED=true`) | Free hosts have ephemeral disks, so a restart would otherwise leave an empty app. Seeding takes ~0.2 s. |

**Known trade-off:** on a free tier with no persistent disk, employees added or edited in the demo reset to the seeded data when the service restarts. For real use: attach a persistent disk and set `DB_PATH` to it, or move to Postgres (the repository layer isolates all SQL).

## Deploy on Render (free)
1. Push the repo to GitHub.
2. render.com, **New +**, **Blueprint** (or **Web Service**), connect the repo.
   - Blueprint: Render reads `render.yaml`.
   - Manual: Runtime **Docker**, plan **Free**, Health Check Path `/api/health`, env var `AUTO_SEED=true`.
3. Wait for the build (about 3 to 5 minutes). The first request after idle can take ~30 s on the free tier (cold start).
4. Open the `https://<name>.onrender.com` URL and add it to the README.

## Run the container locally
```bash
docker build -t acme-salary .
docker run -p 4000:4000 acme-salary
# open http://localhost:4000
```

## Environment variables
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 4000 (Render sets it) | HTTP port |
| `DB_PATH` | `/app/data/salary.db` | SQLite file |
| `AUTO_SEED` | `true` in image | Seed 10,000 employees if DB is empty |
| `FRONTEND_DIST` | `/app/public` | Built frontend folder served by the API |
| `CORS_ORIGIN` | `*` | Only relevant if the frontend is hosted separately |
