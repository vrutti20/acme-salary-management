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

export interface EmployeeInput {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  salary: number;
  hireDate: string;
}

export type SortField = 'fullName' | 'country' | 'jobTitle' | 'department' | 'salaryUsd' | 'hireDate';

export interface ListParams {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
  sort: SortField;
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface ListResponse {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterOptions {
  countries: string[];
  departments: string[];
  jobTitles: string[];
}

export interface PayStats {
  headcount: number;
  minUsd: number;
  maxUsd: number;
  avgUsd: number;
  medianUsd: number;
}
export interface CountryInsight extends PayStats { country: string; currency: string }
export interface JobTitleInsight extends PayStats { jobTitle: string }
export interface DepartmentInsight { department: string; headcount: number; totalPayrollUsd: number; avgUsd: number }
export interface DistributionBucket { fromUsd: number; toUsd: number; count: number }
