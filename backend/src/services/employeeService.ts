import { COUNTRIES } from '../config';
import { toMinor, toUsdMinor } from '../currency';
import { conflict, notFound } from '../errors';
import { Employee, EmployeeRepository, EmployeeRow } from '../repositories/employeeRepository';
import { EmployeeInput, ListQuery } from '../schemas';

/** Pure mapping from validated input to the persisted shape (derives currency, minor units and USD). */
export function toRow(input: EmployeeInput): EmployeeRow {
  const currency = COUNTRIES[input.country];
  const salaryMinor = toMinor(input.salary);
  return {
    fullName: input.fullName,
    email: input.email.toLowerCase(),
    jobTitle: input.jobTitle,
    department: input.department,
    country: input.country,
    currency,
    salaryMinor,
    salaryUsdMinor: toUsdMinor(salaryMinor, currency),
    hireDate: input.hireDate,
  };
}

export class EmployeeService {
  constructor(private repo: EmployeeRepository, private now: () => Date = () => new Date()) {}

  list(q: ListQuery) {
    const { rows, total } = this.repo.list(q);
    return { data: rows, total, page: q.page, pageSize: q.pageSize };
  }

  get(id: number): Employee {
    return this.repo.findById(id) ?? (() => { throw notFound('Employee'); })();
  }

  create(input: EmployeeInput): Employee {
    const row = toRow(input);
    if (this.repo.findIdByEmail(row.email) !== undefined) throw conflict('An employee with this email already exists');
    return this.repo.insert(row, this.now().toISOString());
  }

  update(id: number, input: EmployeeInput): Employee {
    const row = toRow(input);
    const existing = this.repo.findIdByEmail(row.email);
    if (existing !== undefined && existing !== id) throw conflict('An employee with this email already exists');
    return this.repo.update(id, row, this.now().toISOString()) ?? (() => { throw notFound('Employee'); })();
  }

  remove(id: number): void {
    if (!this.repo.delete(id)) throw notFound('Employee');
  }

  filters() {
    return this.repo.distinctValues();
  }
}
