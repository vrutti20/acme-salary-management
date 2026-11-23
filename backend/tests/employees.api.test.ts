import { describe, expect, it } from 'vitest';
import { makeApp, validEmployee } from './helpers';

describe('Employees API', () => {
  it('creates an employee, deriving currency and USD salary', async () => {
    const { api } = makeApp();
    const res = await api.post('/api/employees').send(validEmployee());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, currency: 'INR', salary: 1_200_000, salaryUsd: 14_400 });
  });

  it('returns field-level errors for invalid input', async () => {
    const { api } = makeApp();
    const res = await api.post('/api/employees').send(validEmployee({ salary: -1, email: 'bad' }));
    expect(res.status).toBe(400);
    expect(res.body.details.map((d: any) => d.field).sort()).toEqual(['email', 'salary']);
  });

  it('rejects duplicate emails (case-insensitive) with 409', async () => {
    const { api } = makeApp();
    await api.post('/api/employees').send(validEmployee());
    const res = await api.post('/api/employees').send(validEmployee({ email: 'ASHA.PATEL@acme.com' }));
    expect(res.status).toBe(409);
  });

  it('gets one employee and 404s for a missing one', async () => {
    const { api } = makeApp();
    await api.post('/api/employees').send(validEmployee());
    expect((await api.get('/api/employees/1')).body.fullName).toBe('Asha Patel');
    expect((await api.get('/api/employees/99')).status).toBe(404);
    expect((await api.get('/api/employees/abc')).status).toBe(400);
  });

  it('updates an employee and recalculates derived fields', async () => {
    const { api } = makeApp();
    await api.post('/api/employees').send(validEmployee());
    const res = await api.put('/api/employees/1').send(validEmployee({ country: 'United States', salary: 100_000 }));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ currency: 'USD', salaryUsd: 100_000 });
  });

  it('allows updating an employee while keeping their own email, but not taking another one', async () => {
    const { api } = makeApp();
    await api.post('/api/employees').send(validEmployee());
    await api.post('/api/employees').send(validEmployee({ email: 'b@acme.com' }));
    expect((await api.put('/api/employees/1').send(validEmployee({ salary: 5 }))).status).toBe(200);
    expect((await api.put('/api/employees/2').send(validEmployee())).status).toBe(409);
  });

  it('returns 404 when updating or deleting a missing employee', async () => {
    const { api } = makeApp();
    expect((await api.put('/api/employees/5').send(validEmployee())).status).toBe(404);
    expect((await api.delete('/api/employees/5')).status).toBe(404);
  });

  it('deletes an employee', async () => {
    const { api } = makeApp();
    await api.post('/api/employees').send(validEmployee());
    expect((await api.delete('/api/employees/1')).status).toBe(204);
    expect((await api.get('/api/employees/1')).status).toBe(404);
  });

  describe('listing', () => {
    const seedThree = async (api: ReturnType<typeof makeApp>['api']) => {
      await api.post('/api/employees').send(validEmployee({ fullName: 'Zed', email: 'z@acme.com', country: 'United States', salary: 90_000 }));
      await api.post('/api/employees').send(validEmployee({ fullName: 'Amy', email: 'a@acme.com', country: 'United States', salary: 150_000, jobTitle: 'Designer', department: 'Product' }));
      await api.post('/api/employees').send(validEmployee({ fullName: 'Raj', email: 'r@acme.com' }));
    };

    it('filters by country, department and job title', async () => {
      const { api } = makeApp();
      await seedThree(api);
      expect((await api.get('/api/employees?country=United States')).body.total).toBe(2);
      expect((await api.get('/api/employees?department=Product')).body.data[0].fullName).toBe('Amy');
      expect((await api.get('/api/employees?jobTitle=Designer&country=India')).body.total).toBe(0);
    });

    it('searches by name or email, treating % and _ literally', async () => {
      const { api } = makeApp();
      await seedThree(api);
      expect((await api.get('/api/employees?search=am')).body.data.map((e: any) => e.fullName)).toEqual(['Amy']);
      expect((await api.get('/api/employees?search=r@acme')).body.total).toBe(1);
      expect((await api.get('/api/employees?search=%25')).body.total).toBe(0);
    });

    it('sorts by USD salary so different currencies are comparable', async () => {
      const { api } = makeApp();
      await seedThree(api);
      const res = await api.get('/api/employees?sort=salaryUsd&order=desc');
      expect(res.body.data.map((e: any) => e.fullName)).toEqual(['Amy', 'Zed', 'Raj']);
    });

    it('paginates and reports the total', async () => {
      const { api } = makeApp();
      await seedThree(api);
      const res = await api.get('/api/employees?pageSize=2&page=2');
      expect(res.body).toMatchObject({ total: 3, page: 2, pageSize: 2 });
      expect(res.body.data).toHaveLength(1);
    });

    it('returns distinct filter values', async () => {
      const { api } = makeApp();
      await seedThree(api);
      const res = await api.get('/api/meta/filters');
      expect(res.body).toEqual({
        countries: ['India', 'United States'],
        departments: ['Engineering', 'Product'],
        jobTitles: ['Designer', 'Software Engineer'],
      });
    });
  });

  it('returns 400 for malformed JSON', async () => {
    const { api } = makeApp();
    const res = await api.post('/api/employees').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });
});
