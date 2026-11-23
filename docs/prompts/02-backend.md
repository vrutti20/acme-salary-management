# Prompt 2: backend
"Build the backend in Node + SQLite per the design: layered (routes, services, repositories), zod validation, CRUD with server-side filter/search/sort/pagination, insights (by country, job title, department, distribution) in USD, a reproducible seed of 10,000 employees, and fast deterministic tests."

Review focus: money as integer minor units, sort whitelist (no SQL injection through ORDER BY), LIKE escaping, duplicate-email handling, hand-computed insight expectations.
