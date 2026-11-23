import { describe, expect, it } from 'vitest';
import { employeeInputSchema, listQuerySchema } from '../src/schemas';
import { validEmployee } from './helpers';

const messages = (input: unknown) => {
  const r = employeeInputSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe('employeeInputSchema', () => {
  it('accepts a valid employee and trims text', () => {
    const r = employeeInputSchema.parse(validEmployee({ fullName: '  Asha Patel ' }));
    expect(r.fullName).toBe('Asha Patel');
  });
  it('rejects non-positive salary', () => {
    expect(messages(validEmployee({ salary: 0 }))).toContain('Salary must be greater than 0');
    expect(messages(validEmployee({ salary: -5 }))).toContain('Salary must be greater than 0');
  });
  it('rejects more than 2 decimals', () => {
    expect(messages(validEmployee({ salary: 10.123 }))).toContain('Salary can have at most 2 decimals');
  });
  it('rejects a salary sent as a string', () => {
    expect(messages(validEmployee({ salary: '100' }))).toContain('Salary must be a number');
  });
  it('rejects invalid email, unknown country and blank name', () => {
    expect(messages(validEmployee({ email: 'nope' }))).toContain('Invalid email');
    expect(messages(validEmployee({ country: 'Atlantis' }))).toContain('Unsupported country');
    expect(messages(validEmployee({ fullName: '   ' }))).toContain('Name is required');
  });
  it('rejects future and impossible hire dates', () => {
    expect(messages(validEmployee({ hireDate: '2999-01-01' }))).toContain('Hire date cannot be in the future');
    expect(messages(validEmployee({ hireDate: '2022-02-31' }))).toContain('Invalid date');
    expect(messages(validEmployee({ hireDate: '01/02/2022' }))).toContain('Use YYYY-MM-DD');
  });
});

describe('listQuerySchema', () => {
  it('applies defaults', () => {
    expect(listQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 25, sort: 'fullName', order: 'asc' });
  });
  it('coerces numbers from query strings and caps page size', () => {
    expect(listQuerySchema.parse({ page: '3', pageSize: '50' })).toMatchObject({ page: 3, pageSize: 50 });
    expect(listQuerySchema.safeParse({ pageSize: '1000' }).success).toBe(false);
  });
  it('rejects unknown sort fields (prevents SQL injection via ORDER BY)', () => {
    expect(listQuerySchema.safeParse({ sort: 'id; DROP TABLE employees' }).success).toBe(false);
  });
});
