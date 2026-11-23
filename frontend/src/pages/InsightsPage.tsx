import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, Flex, Row, Select, Skeleton, Statistic, Table, Typography } from 'antd';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { formatCompactUsd, formatNumber, formatUsd } from '../utils/format';

const usdCol = (title: string, key: string) => ({ title, dataIndex: key, key, align: 'right' as const, render: (v: number) => formatUsd(v) });

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card title={title} extra={subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>} style={{ marginBottom: 16 }}>
      {children}
    </Card>
  );
}

function QueryBoundary({ query, children }: { query: { isLoading: boolean; isError: boolean; error: unknown }; children: React.ReactNode }) {
  if (query.isLoading) return <Skeleton active />;
  if (query.isError) return <Alert type="error" showIcon message="Could not load data" description={(query.error as Error).message} />;
  return <>{children}</>;
}

export function InsightsPage() {
  const [jobCountry, setJobCountry] = useState<string>();
  const byCountry = useQuery({ queryKey: ['insights', 'country'], queryFn: api.byCountry });
  const byDept = useQuery({ queryKey: ['insights', 'department'], queryFn: api.byDepartment });
  const byJob = useQuery({ queryKey: ['insights', 'job', jobCountry], queryFn: () => api.byJobTitle(jobCountry) });
  const dist = useQuery({ queryKey: ['insights', 'distribution'], queryFn: api.distribution });

  const headcount = byCountry.data?.reduce((s, c) => s + c.headcount, 0) ?? 0;
  const payroll = byDept.data?.reduce((s, d) => s + d.totalPayrollUsd, 0) ?? 0;

  return (
    <>
      <Typography.Title level={3}>How we pay people</Typography.Title>
      <Typography.Paragraph type="secondary">All amounts are annual base salary, converted to USD using static exchange rates so countries can be compared.</Typography.Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card><Statistic title="Employees" value={formatNumber(headcount)} loading={byCountry.isLoading} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Total payroll (USD)" value={formatCompactUsd(payroll)} loading={byDept.isLoading} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Average salary (USD)" value={headcount ? formatUsd(payroll / headcount) : '-'} loading={byDept.isLoading} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Countries" value={byCountry.data?.length ?? 0} loading={byCountry.isLoading} /></Card></Col>
      </Row>

      <Section title="Pay by country" subtitle="Min / median / average / max">
        <QueryBoundary query={byCountry}>
          <Table size="small" rowKey="country" pagination={false} dataSource={byCountry.data} scroll={{ x: 700 }}
            columns={[
              { title: 'Country', dataIndex: 'country', key: 'country' },
              { title: 'Currency', dataIndex: 'currency', key: 'currency' },
              { title: 'Headcount', dataIndex: 'headcount', key: 'headcount', align: 'right', render: formatNumber },
              usdCol('Min', 'minUsd'), usdCol('Median', 'medianUsd'), usdCol('Average', 'avgUsd'), usdCol('Max', 'maxUsd'),
            ]} />
        </QueryBoundary>
      </Section>

      <Section title="Pay by job title" subtitle="Compare the same role across countries">
        <Flex style={{ marginBottom: 12 }}>
          <Select allowClear showSearch placeholder="All countries" aria-label="Country" style={{ width: 220 }} value={jobCountry} onChange={setJobCountry}
            options={byCountry.data?.map((c) => ({ value: c.country, label: c.country }))} />
        </Flex>
        <QueryBoundary query={byJob}>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={byJob.data} margin={{ left: 8, right: 8, bottom: 56 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="jobTitle" interval={0} angle={-30} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCompactUsd} />
                <Tooltip formatter={(v) => formatUsd(Number(v))} />
                <Legend verticalAlign="top" />
                <Bar dataKey="medianUsd" name="Median" fill="#1677ff" />
                <Bar dataKey="avgUsd" name="Average" fill="#91caff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Table size="small" rowKey="jobTitle" pagination={false} dataSource={byJob.data} style={{ marginTop: 16 }} scroll={{ x: 700 }}
            columns={[
              { title: 'Job title', dataIndex: 'jobTitle', key: 'jobTitle' },
              { title: 'Headcount', dataIndex: 'headcount', key: 'headcount', align: 'right', render: formatNumber },
              usdCol('Min', 'minUsd'), usdCol('Median', 'medianUsd'), usdCol('Average', 'avgUsd'), usdCol('Max', 'maxUsd'),
            ]} />
        </QueryBoundary>
      </Section>

      <Section title="Departments" subtitle="Headcount and payroll">
        <QueryBoundary query={byDept}>
          <Table size="small" rowKey="department" pagination={false} dataSource={byDept.data}
            columns={[
              { title: 'Department', dataIndex: 'department', key: 'department' },
              { title: 'Headcount', dataIndex: 'headcount', key: 'headcount', align: 'right', render: formatNumber },
              usdCol('Total payroll', 'totalPayrollUsd'), usdCol('Average', 'avgUsd'),
            ]} />
        </QueryBoundary>
      </Section>

      <Section title="Salary distribution" subtitle="Employees per $20k salary band (USD)">
        <QueryBoundary query={dist}>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dist.data?.map((b) => ({ band: `${formatCompactUsd(b.fromUsd)}-${formatCompactUsd(b.toUsd)}`, count: b.count }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="band" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(v) => [formatNumber(Number(v)), 'Employees']} />
                <Bar dataKey="count" name="Employees" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </QueryBoundary>
      </Section>
    </>
  );
}
