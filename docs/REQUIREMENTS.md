# Requirements: Salary Management for ACME

## Goal
Replace the Excel sheets ACME's HR team uses today with a web app where the HR Manager can maintain salary data for ~10,000 employees across multiple countries, and can answer "how do we pay people?" in seconds instead of hours.

## Persona
**HR Manager** (single user type). Needs to find and edit an employee quickly, and to compare pay across countries, job titles and departments.

## Scope and features (v1)
| # | Feature | Why |
|---|---------|-----|
| 1 | Employee list with search, filter (country, department, job title), sort, server-side pagination | 10k rows cannot be browsed in a spreadsheet or loaded in one browser call |
| 2 | Add / edit / delete an employee (name, email, job title, department, country, currency, salary, hire date) | Core replacement for editing Excel |
| 3 | Validation with clear messages (unique email, salary > 0, valid country/currency, no future hire date) | Prevents the data errors Excel allows |
| 4 | Insights: min / max / avg / median salary by country | Primary "how do we pay" question |
| 5 | Insights: avg salary by job title, optionally within one country | Detects pay gaps for the same role |
| 6 | Insights: headcount and total payroll by department | Budget view |
| 7 | Salary distribution (histogram bands) | Shows shape of pay across the org |
| 8 | Salaries compared in USD using static exchange rates (original currency still stored and shown) | Cross-country comparison is meaningless without normalising |
| 9 | Seed script generating 10,000 reproducible employees | Required for demo and performance checks |

## Deliberately left out (and why)
| Not included | Reasoning |
|---|---|
| Login / roles / permissions | One persona; adds a lot of code without answering the business question. Listed as the first follow-up. |
| Payroll, tax, bonus, equity | Different product. Base salary alone answers "how do we pay". |
| Live exchange rates | Makes tests non-deterministic and adds an external dependency. Static rates in config. |
| Salary history / audit log | Valuable, but not needed for v1 questions. Schema can grow to support it. |
| Excel/CSV import UI | The seed script covers initial data; import is a natural next step. |
| Multi-tenant, i18n, mobile app | Single org, single HR user, desktop web is enough. |

## Success criteria
- Employee list responds in < 300 ms and insights in < 500 ms on 10,000 rows.
- Core logic (validation, statistics, currency conversion, filtering) covered by fast, deterministic unit tests.
- Deployed, seeded and demonstrable end to end.

## Assumptions
- Salary is annual base salary; stored as integer in minor units with its currency.
- One employee has one job title, department and country.
