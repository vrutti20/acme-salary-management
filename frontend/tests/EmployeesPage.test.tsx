import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/api/client';
import type { Employee } from '../src/api/types';
import { EmployeesPage } from '../src/pages/EmployeesPage';

vi.mock('../src/api/client', async (orig) => {
  const actual = await orig<typeof import('../src/api/client')>();
  return {
    ...actual,
    api: {
      listEmployees: vi.fn(), filters: vi.fn(), createEmployee: vi.fn(), updateEmployee: vi.fn(), deleteEmployee: vi.fn(),
    },
  };
});

const emp = (id: number, name: string, over: Partial<Employee> = {}): Employee => ({
  id, fullName: name, email: `${name.toLowerCase().replace(' ', '.')}@acme.com`, jobTitle: 'Designer', department: 'Product',
  country: 'United States', currency: 'USD', salary: 100000, salaryUsd: 100000, hireDate: '2021-05-01',
  createdAt: '', updatedAt: '', ...over,
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <EmployeesPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.mocked(api.filters).mockResolvedValue({ countries: ['India', 'United States'], departments: ['Product'], jobTitles: ['Designer'] });
  vi.mocked(api.listEmployees).mockResolvedValue({ data: [emp(1, 'Amy Lee'), emp(2, 'Raj Shah', { country: 'India', currency: 'INR', salary: 1200000, salaryUsd: 14400 })], total: 2, page: 1, pageSize: 25 });
});

describe('EmployeesPage', () => {
  it('renders employees with local salary and USD salary', async () => {
    renderPage();
    expect(await screen.findByText('Amy Lee')).toBeInTheDocument();
    expect(screen.getByText('₹1,200,000')).toBeInTheDocument();
    expect(screen.getByText('$14,400')).toBeInTheDocument();
    expect(screen.getByText('2 employees')).toBeInTheDocument();
  });

  it('sends the search term to the server after the debounce', async () => {
    renderPage();
    await screen.findByText('Amy Lee');
    await userEvent.type(screen.getByPlaceholderText('Search by name or email'), 'raj');
    await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'raj', page: 1 })));
  });

  it('shows an error with a retry button when loading fails', async () => {
    vi.mocked(api.listEmployees).mockRejectedValue(new Error('Cannot reach the server'));
    renderPage();
    expect(await screen.findByText('Could not load employees')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    vi.mocked(api.listEmployees).mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 25 });
    renderPage();
    expect(await screen.findByText('No employees match your filters')).toBeInTheDocument();
  });

  it('deletes an employee after confirmation', async () => {
    vi.mocked(api.deleteEmployee).mockResolvedValue(undefined);
    renderPage();
    await screen.findByText('Amy Lee');
    await userEvent.click(screen.getByRole('button', { name: 'Delete Amy Lee' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(api.deleteEmployee).toHaveBeenCalledWith(1));
  });
});
