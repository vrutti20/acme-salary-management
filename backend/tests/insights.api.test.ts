import { beforeEach, describe, expect, it } from 'vitest';
import { makeApp, validEmployee } from './helpers';

/**
 * Fixed dataset (annual salary in USD after conversion):
 *  US  Software Engineer 100k, 120k, 140k  (Engineering)
 *  US  Designer           60k              (Product)
 *  IN  Software Engineer  1.2M INR = 14.4k, 1.0M INR = 12k (Engineering)
 */
let api: ReturnType<typeof makeApp>['api'];

beforeEach(async () => {
  ({ api } = makeApp());
  const us = { country: 'United States' };
  const rows = [
    validEmployee({ email: 'a@x.com', ...us, salary: 100_000 }),
    validEmployee({ email: 'b@x.com', ...us, salary: 120_000 }),
    validEmployee({ email: 'c@x.com', ...us, salary: 140_000 }),
    validEmployee({ email: 'd@x.com', ...us, salary: 60_000, jobTitle: 'Designer', department: 'Product' }),
    validEmployee({ email: 'e@x.com', salary: 1_200_000 }),
    validEmployee({ email: 'f@x.com', salary: 1_000_000 }),
  ];
  for (const r of rows) await api.post('/api/employees').send(r);
});

describe('Insights API', () => {
  it('summarises pay by country in USD', async () => {
    const { body } = await api.get('/api/insights/by-country');
    expect(body).toEqual([
      { country: 'India', currency: 'INR', headcount: 2, minUsd: 12_000, maxUsd: 14_400, avgUsd: 13_200, medianUsd: 13_200 },
      { country: 'United States', currency: 'USD', headcount: 4, minUsd: 60_000, maxUsd: 140_000, avgUsd: 105_000, medianUsd: 110_000 },
    ]);
  });

  it('summarises pay by job title across the org', async () => {
    const { body } = await api.get('/api/insights/by-job-title');
    const swe = body.find((r: any) => r.jobTitle === 'Software Engineer');
    expect(swe).toMatchObject({ headcount: 5, minUsd: 12_000, maxUsd: 140_000, medianUsd: 100_000 });
  });

  it('narrows job-title insights to one country', async () => {
    const { body } = await api.get('/api/insights/by-job-title?country=United States');
    expect(body).toEqual([
      { jobTitle: 'Designer', headcount: 1, minUsd: 60_000, maxUsd: 60_000, avgUsd: 60_000, medianUsd: 60_000 },
      { jobTitle: 'Software Engineer', headcount: 3, minUsd: 100_000, maxUsd: 140_000, avgUsd: 120_000, medianUsd: 120_000 },
    ]);
  });

  it('reports headcount and payroll by department', async () => {
    const { body } = await api.get('/api/insights/by-department');
    expect(body).toEqual([
      { department: 'Engineering', headcount: 5, totalPayrollUsd: 386_400, avgUsd: 77_280 },
      { department: 'Product', headcount: 1, totalPayrollUsd: 60_000, avgUsd: 60_000 },
    ]);
  });

  it('builds a salary distribution with 20k USD buckets', async () => {
    const { body } = await api.get('/api/insights/distribution');
    expect(body.map((b: any) => b.count)).toEqual([2, 0, 0, 1, 0, 1, 1, 1]);
    expect(body[0]).toEqual({ fromUsd: 0, toUsd: 20_000, count: 2 });
  });

  it('rejects absurdly small bucket sizes', async () => {
    expect((await api.get('/api/insights/distribution?bucketSizeUsd=1')).status).toBe(400);
  });

  it('returns empty lists when there is no data', async () => {
    const { api: empty } = makeApp();
    expect((await empty.get('/api/insights/by-country')).body).toEqual([]);
    expect((await empty.get('/api/insights/distribution')).body).toEqual([]);
  });
});
