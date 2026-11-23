import { DB } from '../db';
import { ListQuery, SortField } from '../schemas';
import { fromMinor } from '../currency';

/** What gets persisted. Derived fields (currency, minor units, USD) are computed by the service. */
export interface EmployeeRow {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salaryMinor: number;
  salaryUsdMinor: number;
  hireDate: string;
}

export interface Employee {
  id: number;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salary: number;
  salaryUsd: number;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryRow {
  country: string;
  jobTitle: string;
  department: string;
  salaryUsdMinor: number;
}

const SORT_COLUMNS: Record<SortField, string> = {
  fullName: 'full_name',
  country: 'country',
  jobTitle: 'job_title',
  department: 'department',
  salaryUsd: 'salary_usd_minor',
  hireDate: 'hire_date',
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function toEmployee(r: any): Employee {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    jobTitle: r.job_title,
    department: r.department,
    country: r.country,
    currency: r.currency,
    salary: fromMinor(r.salary_minor),
    salaryUsd: fromMinor(r.salary_usd_minor),
    hireDate: r.hire_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class EmployeeRepository {
  constructor(private db: DB) {}

  insert(row: EmployeeRow, now: string): Employee {
    const info = this.db
      .prepare(
        `INSERT INTO employees (full_name,email,job_title,department,country,currency,salary_minor,salary_usd_minor,hire_date,created_at,updated_at)
         VALUES (@fullName,@email,@jobTitle,@department,@country,@currency,@salaryMinor,@salaryUsdMinor,@hireDate,@now,@now)`,
      )
      .run({ ...row, now });
    return this.findById(Number(info.lastInsertRowid))!;
  }

  /** Bulk insert in a single transaction (used by the seed script). */
  insertMany(rows: EmployeeRow[], now: string): void {
    const stmt = this.db.prepare(
      `INSERT INTO employees (full_name,email,job_title,department,country,currency,salary_minor,salary_usd_minor,hire_date,created_at,updated_at)
       VALUES (@fullName,@email,@jobTitle,@department,@country,@currency,@salaryMinor,@salaryUsdMinor,@hireDate,@now,@now)`,
    );
    this.db.transaction((batch: EmployeeRow[]) => {
      for (const r of batch) stmt.run({ ...r, now });
    })(rows);
  }

  update(id: number, row: EmployeeRow, now: string): Employee | undefined {
    const info = this.db
      .prepare(
        `UPDATE employees SET full_name=@fullName,email=@email,job_title=@jobTitle,department=@department,
           country=@country,currency=@currency,salary_minor=@salaryMinor,salary_usd_minor=@salaryUsdMinor,
           hire_date=@hireDate,updated_at=@now WHERE id=@id`,
      )
      .run({ ...row, now, id });
    return info.changes === 0 ? undefined : this.findById(id);
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM employees WHERE id = ?').run(id).changes > 0;
  }

  deleteAll(): void {
    this.db.exec("DELETE FROM employees; DELETE FROM sqlite_sequence WHERE name='employees';");
  }

  findById(id: number): Employee | undefined {
    const r = this.db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    return r ? toEmployee(r) : undefined;
  }

  findIdByEmail(email: string): number | undefined {
    const r = this.db.prepare('SELECT id FROM employees WHERE email = ?').get(email) as { id: number } | undefined;
    return r?.id;
  }

  list(q: ListQuery): { rows: Employee[]; total: number } {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    if (q.search) {
      where.push("(full_name LIKE @search ESCAPE '\\' OR email LIKE @search ESCAPE '\\')");
      params.search = `%${escapeLike(q.search)}%`;
    }
    if (q.country) { where.push('country = @country'); params.country = q.country; }
    if (q.department) { where.push('department = @department'); params.department = q.department; }
    if (q.jobTitle) { where.push('job_title = @jobTitle'); params.jobTitle = q.jobTitle; }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const total = (this.db.prepare(`SELECT COUNT(*) AS n FROM employees ${clause}`).get(params) as { n: number }).n;
    const col = SORT_COLUMNS[q.sort];
    const dir = q.order === 'desc' ? 'DESC' : 'ASC';
    const rows = this.db
      .prepare(`SELECT * FROM employees ${clause} ORDER BY ${col} ${dir}, id ASC LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit: q.pageSize, offset: (q.page - 1) * q.pageSize });
    return { rows: rows.map(toEmployee), total };
  }

  salaryRows(country?: string): SalaryRow[] {
    const sql = `SELECT country, job_title AS jobTitle, department, salary_usd_minor AS salaryUsdMinor FROM employees`;
    return (country
      ? this.db.prepare(`${sql} WHERE country = ?`).all(country)
      : this.db.prepare(sql).all()) as SalaryRow[];
  }

  distinctValues(): { countries: string[]; departments: string[]; jobTitles: string[] } {
    const col = (c: string) =>
      (this.db.prepare(`SELECT DISTINCT ${c} AS v FROM employees ORDER BY v`).all() as { v: string }[]).map((r) => r.v);
    return { countries: col('country'), departments: col('department'), jobTitles: col('job_title') };
  }
}
