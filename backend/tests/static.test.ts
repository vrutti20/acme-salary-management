import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { openDb } from '../src/db';
import { seedIfEmpty } from '../src/scripts/seedData';

describe('single-service hosting', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<html>app</html>');
  const api = request(createApp(openDb(':memory:'), '*', dir));

  it('serves the frontend at / and for client-side routes', async () => {
    expect((await api.get('/')).text).toContain('app');
    expect((await api.get('/insights')).text).toContain('app');
  });

  it('keeps unknown /api routes as JSON 404 (not index.html)', async () => {
    const res = await api.get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('still serves the API normally', async () => {
    expect((await api.get('/api/health')).body).toEqual({ status: 'ok' });
  });
});

describe('seedIfEmpty', () => {
  it('seeds an empty database once and leaves existing data alone', () => {
    const db = openDb(':memory:');
    expect(seedIfEmpty(db, 30)).toBe(true);
    expect(seedIfEmpty(db, 30)).toBe(false);
    expect((db.prepare('SELECT COUNT(*) AS n FROM employees').get() as { n: number }).n).toBe(30);
  });
});
