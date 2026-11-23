import { describe, expect, it } from 'vitest';
import { openDb } from '../src/db';
import { EmployeeRepository } from '../src/repositories/employeeRepository';
import { employeeInputSchema } from '../src/schemas';
import { generateEmployees, seedDatabase } from '../src/scripts/seedData';

describe('seed', () => {
  it('is deterministic for the same seed', () => {
    expect(generateEmployees(50, 7)).toEqual(generateEmployees(50, 7));
    expect(generateEmployees(50, 7)).not.toEqual(generateEmployees(50, 8));
  });

  it('generates employees that pass the same validation as the API', () => {
    for (const e of generateEmployees(300)) expect(employeeInputSchema.safeParse(e).success).toBe(true);
  });

  it('generates unique emails', () => {
    const emails = new Set(generateEmployees(2000).map((e) => e.email));
    expect(emails.size).toBe(2000);
  });

  it('is idempotent: re-seeding replaces rather than duplicates', () => {
    const db = openDb(':memory:');
    seedDatabase(db, 120);
    seedDatabase(db, 120);
    const repo = new EmployeeRepository(db);
    expect(repo.list({ page: 1, pageSize: 1, sort: 'fullName', order: 'asc' }).total).toBe(120);
  });
});
