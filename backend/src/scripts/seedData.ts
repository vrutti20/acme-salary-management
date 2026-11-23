import { COUNTRIES, FX_TO_USD } from '../config';
import { DB } from '../db';
import { EmployeeRepository, EmployeeRow } from '../repositories/employeeRepository';
import { EmployeeInput } from '../schemas';
import { toRow } from '../services/employeeService';

/** Small, fast, seedable PRNG so seeded data is reproducible. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Aarav','Priya','Rohan','Ananya','Vikram','Neha','Arjun','Isha','Liam','Emma','Noah','Olivia','Oliver','Amelia','Lukas','Sophie','Hans','Marie','Wei','Mei','Chen','Lina','Jack','Chloe','Ethan','Mia','Lucas','Zoe','Raj','Kavya'];
const LAST = ['Patel','Shah','Mehta','Sharma','Gupta','Smith','Johnson','Brown','Taylor','Wilson','Muller','Schmidt','Dubois','Martin','Tan','Lim','Wong','Chen','Nguyen','Singh','Kumar','Reddy','Clark','Walker','Hall','Young','King','Scott','Green','Baker'];

interface Role { title: string; department: string; minUsd: number; maxUsd: number }
const ROLES: Role[] = [
  { title: 'Software Engineer', department: 'Engineering', minUsd: 70000, maxUsd: 130000 },
  { title: 'Senior Software Engineer', department: 'Engineering', minUsd: 110000, maxUsd: 190000 },
  { title: 'Engineering Manager', department: 'Engineering', minUsd: 140000, maxUsd: 230000 },
  { title: 'QA Engineer', department: 'Engineering', minUsd: 50000, maxUsd: 95000 },
  { title: 'DevOps Engineer', department: 'Engineering', minUsd: 80000, maxUsd: 150000 },
  { title: 'Product Manager', department: 'Product', minUsd: 90000, maxUsd: 170000 },
  { title: 'Designer', department: 'Product', minUsd: 60000, maxUsd: 120000 },
  { title: 'Sales Executive', department: 'Sales', minUsd: 45000, maxUsd: 110000 },
  { title: 'Sales Manager', department: 'Sales', minUsd: 90000, maxUsd: 170000 },
  { title: 'HR Specialist', department: 'HR', minUsd: 45000, maxUsd: 90000 },
  { title: 'Recruiter', department: 'HR', minUsd: 45000, maxUsd: 85000 },
  { title: 'Accountant', department: 'Finance', minUsd: 50000, maxUsd: 95000 },
  { title: 'Financial Analyst', department: 'Finance', minUsd: 60000, maxUsd: 120000 },
  { title: 'Operations Analyst', department: 'Operations', minUsd: 45000, maxUsd: 90000 },
];

/** Country weight (share of headcount) and pay level relative to the US. */
const COUNTRY_PROFILE: Record<string, { weight: number; pay: number }> = {
  India: { weight: 30, pay: 0.3 },
  'United States': { weight: 25, pay: 1.0 },
  'United Kingdom': { weight: 10, pay: 0.8 },
  Germany: { weight: 10, pay: 0.85 },
  Singapore: { weight: 7, pay: 0.85 },
  Australia: { weight: 6, pay: 0.85 },
  Canada: { weight: 6, pay: 0.85 },
  France: { weight: 6, pay: 0.8 },
};

const HIRE_START = Date.UTC(2015, 0, 1);
const HIRE_SPAN_DAYS = 3900; // ends around Nov 2025, never in the future

export function generateEmployees(count: number, seed = 42): EmployeeInput[] {
  const rand = mulberry32(seed);
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  const countries = Object.keys(COUNTRY_PROFILE);
  const totalWeight = countries.reduce((s, c) => s + COUNTRY_PROFILE[c].weight, 0);

  const pickCountry = () => {
    let r = rand() * totalWeight;
    for (const c of countries) {
      r -= COUNTRY_PROFILE[c].weight;
      if (r < 0) return c;
    }
    return countries[0];
  };

  return Array.from({ length: count }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const role = pick(ROLES);
    const country = pickCountry();
    const usd = (role.minUsd + rand() * (role.maxUsd - role.minUsd)) * COUNTRY_PROFILE[country].pay;
    const local = usd / FX_TO_USD[COUNTRIES[country]];
    const salary = Math.max(1000, Math.round(local / 100) * 100);
    const hire = new Date(HIRE_START + Math.floor(rand() * HIRE_SPAN_DAYS) * 86_400_000);
    return {
      fullName: `${first} ${last}`,
      email: `${first}.${last}.${i + 1}@acme.com`.toLowerCase(),
      jobTitle: role.title,
      department: role.department,
      country,
      salary,
      hireDate: hire.toISOString().slice(0, 10),
    };
  });
}

/** Idempotent: clears existing employees, then inserts `count` in batches of 1000. */
export function seedDatabase(db: DB, count = 10_000, seed = 42): number {
  const repo = new EmployeeRepository(db);
  repo.deleteAll();
  const rows: EmployeeRow[] = generateEmployees(count, seed).map(toRow);
  const now = new Date().toISOString();
  for (let i = 0; i < rows.length; i += 1000) repo.insertMany(rows.slice(i, i + 1000), now);
  return rows.length;
}

/** Seeds only when the table is empty. Used on boot so a fresh deploy (ephemeral disk) is never blank. */
export function seedIfEmpty(db: DB, count = 10_000, seed = 42): boolean {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM employees').get() as { n: number };
  if (n > 0) return false;
  seedDatabase(db, count, seed);
  return true;
}
