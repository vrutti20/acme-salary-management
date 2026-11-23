import Database from 'better-sqlite3';

export type DB = Database.Database;

export function migrate(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name        TEXT NOT NULL,
      email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
      job_title        TEXT NOT NULL,
      department       TEXT NOT NULL,
      country          TEXT NOT NULL,
      currency         TEXT NOT NULL,
      salary_minor     INTEGER NOT NULL CHECK (salary_minor > 0),
      salary_usd_minor INTEGER NOT NULL CHECK (salary_usd_minor >= 0),
      hire_date        TEXT NOT NULL,
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_emp_country     ON employees(country);
    CREATE INDEX IF NOT EXISTS idx_emp_department  ON employees(department);
    CREATE INDEX IF NOT EXISTS idx_emp_job_title   ON employees(job_title);
    CREATE INDEX IF NOT EXISTS idx_emp_country_job ON employees(country, job_title);
  `);
}

export function openDb(file: string): DB {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  migrate(db);
  return db;
}
