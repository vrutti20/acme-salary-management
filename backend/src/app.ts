import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import { ZodError, z } from 'zod';
import { DB } from './db';
import { AppError } from './errors';
import { EmployeeRepository } from './repositories/employeeRepository';
import { employeeInputSchema, listQuerySchema } from './schemas';
import { EmployeeService } from './services/employeeService';
import { InsightsService } from './services/insightsService';

const idSchema = z.coerce.number().int().positive();

export function createApp(db: DB, corsOrigin: string = '*') {
  const repo = new EmployeeRepository(db);
  const employees = new EmployeeService(repo);
  const insights = new InsightsService(repo);

  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/employees', (req, res) => res.json(employees.list(listQuerySchema.parse(req.query))));
  app.post('/api/employees', (req, res) => {
    res.status(201).json(employees.create(employeeInputSchema.parse(req.body)));
  });
  app.get('/api/employees/:id', (req, res) => res.json(employees.get(idSchema.parse(req.params.id))));
  app.put('/api/employees/:id', (req, res) => {
    res.json(employees.update(idSchema.parse(req.params.id), employeeInputSchema.parse(req.body)));
  });
  app.delete('/api/employees/:id', (req, res) => {
    employees.remove(idSchema.parse(req.params.id));
    res.status(204).end();
  });

  app.get('/api/meta/filters', (_req, res) => res.json(employees.filters()));

  app.get('/api/insights/by-country', (_req, res) => res.json(insights.byCountry()));
  app.get('/api/insights/by-job-title', (req, res) => {
    const { country } = z.object({ country: z.string().trim().min(1).optional() }).parse(req.query);
    res.json(insights.byJobTitle(country));
  });
  app.get('/api/insights/by-department', (_req, res) => res.json(insights.byDepartment()));
  app.get('/api/insights/distribution', (req, res) => {
    const { bucketSizeUsd } = z.object({ bucketSizeUsd: z.coerce.number().int().min(1000).optional() }).parse(req.query);
    res.json(insights.distribution(bucketSizeUsd));
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return res.status(400).json({ error: 'Validation failed', details });
    }
    if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'Invalid JSON body' });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  };
  app.use(errorHandler);

  return app;
}
