import fs from 'fs';
import path from 'path';
import { createApp } from './app';
import { openDb } from './db';

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'salary.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const app = createApp(openDb(dbPath), process.env.CORS_ORIGIN ?? '*');
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API listening on :${port} (db: ${dbPath})`));
