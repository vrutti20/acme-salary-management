import request from 'supertest';
import { createApp } from '../src/app';
import { openDb } from '../src/db';

export function makeApp() {
  const db = openDb(':memory:');
  const app = createApp(db);
  return { db, app, api: request(app) };
}

export const validEmployee = (overrides: Record<string, unknown> = {}) => ({
  fullName: 'Asha Patel',
  email: 'asha.patel@acme.com',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'India',
  salary: 1_200_000,
  hireDate: '2022-04-01',
  ...overrides,
});
