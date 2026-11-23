import fs from 'fs';
import path from 'path';
import { openDb } from '../db';
import { seedDatabase } from './seedData';

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'salary.db');
const count = Number(process.argv[2] ?? 10_000);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const started = Date.now();
const n = seedDatabase(openDb(dbPath), count);
console.log(`Seeded ${n} employees into ${dbPath} in ${Date.now() - started} ms`);
