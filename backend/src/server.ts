import fs from 'fs';
import path from 'path';
import { createApp } from './app';
import { openDb } from './db';
import { seedIfEmpty } from './scripts/seedData';

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'salary.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = openDb(dbPath);

if (process.env.AUTO_SEED === 'true' && seedIfEmpty(db)) console.log('Database was empty: seeded 10,000 employees');

const app = createApp(db, process.env.CORS_ORIGIN ?? '*', process.env.FRONTEND_DIST);
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API listening on :${port} (db: ${dbPath})`));
