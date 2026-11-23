import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/api/client';
import type { Employee } from '../src/api/types';
import { EmployeeFormModal } from '../src/components/EmployeeFormModal';

const employee: Employee = {
  id: 1, fullName: 'Asha Patel', email: 'asha@acme.com', jobTitle: 'Software Engineer', department: 'Engineering',
  country: 'India', currency: 'INR', salary: 1200000, salaryUsd: 14400, hireDate: '2022-04-01',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

describe('EmployeeFormModal', () => {
  it('shows required-field errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn();
    render(<EmployeeFormModal open onSubmit={onSubmit} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Salary is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prefills when editing and submits a normalised payload', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EmployeeFormModal open employee={employee} onSubmit={onSubmit} onCancel={() => {}} />);
    expect(await screen.findByDisplayValue('Asha Patel')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      fullName: 'Asha Patel', email: 'asha@acme.com', jobTitle: 'Software Engineer', department: 'Engineering',
      country: 'India', salary: 1200000, hireDate: '2022-04-01',
    });
  });

  it('shows the server error under the email field on a duplicate (409)', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, 'An employee with this email already exists'));
    render(<EmployeeFormModal open employee={employee} onSubmit={onSubmit} onCancel={() => {}} />);
    await screen.findByDisplayValue('Asha Patel');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('An employee with this email already exists')).toBeInTheDocument();
  });
});
