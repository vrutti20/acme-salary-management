import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Flex, Input, Popconfirm, Select, Space, Table, Typography, message } from 'antd';
import type { TableProps } from 'antd';
import { useState } from 'react';
import { api } from '../api/client';
import type { Employee, EmployeeInput, ListParams, SortField } from '../api/types';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { formatMoney, formatUsd } from '../utils/format';
import { useDebounced } from '../utils/useDebounced';

const SORTABLE: SortField[] = ['fullName', 'country', 'jobTitle', 'department', 'salaryUsd', 'hireDate'];

export function EmployeesPage() {
  const qc = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string>();
  const [department, setDepartment] = useState<string>();
  const [jobTitle, setJobTitle] = useState<string>();
  const [sort, setSort] = useState<SortField>('fullName');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modal, setModal] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });

  const debouncedSearch = useDebounced(search);
  const params: ListParams = { search: debouncedSearch.trim() || undefined, country, department, jobTitle, sort, order, page, pageSize };

  const list = useQuery({ queryKey: ['employees', params], queryFn: () => api.listEmployees(params), placeholderData: keepPreviousData });
  const filters = useQuery({ queryKey: ['filters'], queryFn: api.filters, staleTime: 60_000 });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['employees'] });
    qc.invalidateQueries({ queryKey: ['insights'] });
    qc.invalidateQueries({ queryKey: ['filters'] });
  };

  const save = useMutation({
    mutationFn: (input: EmployeeInput) => (modal.employee ? api.updateEmployee(modal.employee.id, input) : api.createEmployee(input)),
    onSuccess: () => {
      messageApi.success(modal.employee ? 'Employee updated' : 'Employee added');
      setModal({ open: false, employee: null });
      refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteEmployee(id),
    onSuccess: () => { messageApi.success('Employee deleted'); refresh(); },
    onError: (e: Error) => messageApi.error(e.message),
  });

  const resetPage = () => setPage(1);
  const sortOrder = (field: SortField) => (sort === field ? (order === 'asc' ? ('ascend' as const) : ('descend' as const)) : null);

  const columns: TableProps<Employee>['columns'] = [
    { title: 'Name', dataIndex: 'fullName', key: 'fullName', sorter: true, sortOrder: sortOrder('fullName'), render: (v, r) => (<><div>{v}</div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Typography.Text></>) },
    { title: 'Job title', dataIndex: 'jobTitle', key: 'jobTitle', sorter: true, sortOrder: sortOrder('jobTitle') },
    { title: 'Department', dataIndex: 'department', key: 'department', sorter: true, sortOrder: sortOrder('department') },
    { title: 'Country', dataIndex: 'country', key: 'country', sorter: true, sortOrder: sortOrder('country') },
    { title: 'Salary', key: 'salary', align: 'right', render: (_, r) => formatMoney(r.salary, r.currency) },
    { title: 'Salary (USD)', dataIndex: 'salaryUsd', key: 'salaryUsd', align: 'right', sorter: true, sortOrder: sortOrder('salaryUsd'), render: (v: number) => formatUsd(v) },
    { title: 'Hired', dataIndex: 'hireDate', key: 'hireDate', sorter: true, sortOrder: sortOrder('hireDate') },
    {
      title: '', key: 'actions', width: 90,
      render: (_, r) => (
        <Space>
          <Button type="text" aria-label={`Edit ${r.fullName}`} icon={<EditOutlined />} onClick={() => setModal({ open: true, employee: r })} />
          <Popconfirm title="Delete this employee?" description={r.fullName} okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => remove.mutate(r.id)}>
            <Button type="text" danger aria-label={`Delete ${r.fullName}`} icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const onTableChange: TableProps<Employee>['onChange'] = (pagination, _f, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const key = s?.columnKey as SortField | undefined;
    if (key && SORTABLE.includes(key) && s.order) { setSort(key); setOrder(s.order === 'ascend' ? 'asc' : 'desc'); }
    else { setSort('fullName'); setOrder('asc'); }
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 25);
  };

  const filterSelect = (placeholder: string, value: string | undefined, options: string[] | undefined, onChange: (v?: string) => void) => (
    <Select
      allowClear showSearch placeholder={placeholder} value={value} style={{ minWidth: 170 }}
      aria-label={placeholder}
      options={(options ?? []).map((o) => ({ value: o, label: o }))}
      onChange={(v) => { onChange(v); resetPage(); }}
    />
  );

  return (
    <>
      {contextHolder}
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Employees</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true, employee: null })}>Add employee</Button>
      </Flex>

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search by name or email" style={{ width: 280 }}
            value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} />
          {filterSelect('Country', country, filters.data?.countries, setCountry)}
          {filterSelect('Department', department, filters.data?.departments, setDepartment)}
          {filterSelect('Job title', jobTitle, filters.data?.jobTitles, setJobTitle)}
        </Flex>

        {list.isError && (
          <Alert type="error" showIcon style={{ marginBottom: 16 }} message="Could not load employees" description={(list.error as Error).message}
            action={<Button size="small" onClick={() => list.refetch()}>Retry</Button>} />
        )}

        <Table<Employee>
          rowKey="id" columns={columns} dataSource={list.data?.data} loading={list.isFetching} onChange={onTableChange} scroll={{ x: 900 }}
          locale={{ emptyText: list.isError ? 'No data' : 'No employees match your filters' }}
          pagination={{ current: page, pageSize, total: list.data?.total ?? 0, showSizeChanger: true, pageSizeOptions: [10, 25, 50, 100], showTotal: (t) => `${t.toLocaleString()} employees` }}
        />
      </Card>

      <EmployeeFormModal
        open={modal.open} employee={modal.employee}
        jobTitleOptions={filters.data?.jobTitles} departmentOptions={filters.data?.departments}
        onCancel={() => setModal({ open: false, employee: null })}
        onSubmit={async (input) => {
          try { await save.mutateAsync(input); }
          catch (e) {
            const err = e as { status?: number; details?: unknown[] };
            if (err.status === 409 || err.details?.length) throw e; // form shows field errors
            messageApi.error((e as Error).message);
          }
        }}
      />
    </>
  );
}
