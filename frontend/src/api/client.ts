import type {
  CountryInsight, DepartmentInsight, DistributionBucket, Employee, EmployeeInput,
  FilterOptions, JobTitleInsight, ListParams, ListResponse,
} from './types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export interface FieldError { field: string; message: string }

export class ApiError extends Error {
  constructor(public status: number, message: string, public details: FieldError[] = []) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please check your connection and try again.');
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'Something went wrong', body.details ?? []);
  return body as T;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const api = {
  listEmployees: (p: ListParams) => request<ListResponse>(`/api/employees${qs({ ...p })}`),
  createEmployee: (input: EmployeeInput) =>
    request<Employee>('/api/employees', { method: 'POST', body: JSON.stringify(input) }),
  updateEmployee: (id: number, input: EmployeeInput) =>
    request<Employee>(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteEmployee: (id: number) => request<void>(`/api/employees/${id}`, { method: 'DELETE' }),
  filters: () => request<FilterOptions>('/api/meta/filters'),
  byCountry: () => request<CountryInsight[]>('/api/insights/by-country'),
  byJobTitle: (country?: string) => request<JobTitleInsight[]>(`/api/insights/by-job-title${qs({ country })}`),
  byDepartment: () => request<DepartmentInsight[]>('/api/insights/by-department'),
  distribution: () => request<DistributionBucket[]>('/api/insights/distribution'),
};
