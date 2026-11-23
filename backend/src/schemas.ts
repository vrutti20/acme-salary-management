import { z } from 'zod';
import { COUNTRY_NAMES, MAX_PAGE_SIZE } from './config';

const isRealDate = (s: string) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const todayIso = () => new Date().toISOString().slice(0, 10);

export const employeeInputSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  jobTitle: z.string().trim().min(1, 'Job title is required').max(100),
  department: z.string().trim().min(1, 'Department is required').max(100),
  country: z.enum(COUNTRY_NAMES, { error: 'Unsupported country' }),
  salary: z
    .number({ error: 'Salary must be a number' })
    .positive('Salary must be greater than 0')
    .max(1_000_000_000, 'Salary is too large')
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Salary can have at most 2 decimals'),
  hireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .refine(isRealDate, 'Invalid date')
    .refine((s) => s <= todayIso(), 'Hire date cannot be in the future'),
});
export type EmployeeInput = z.infer<typeof employeeInputSchema>;

export const SORT_FIELDS = ['fullName', 'country', 'jobTitle', 'department', 'salaryUsd', 'hireDate'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

const optionalText = z.string().trim().min(1).optional();

export const listQuerySchema = z.object({
  search: optionalText,
  country: optionalText,
  department: optionalText,
  jobTitle: optionalText,
  sort: z.enum(SORT_FIELDS).default('fullName'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(25),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
