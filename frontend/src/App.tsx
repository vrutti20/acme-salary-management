import { BarChartOutlined, TeamOutlined } from '@ant-design/icons';
import { Layout, Menu, Skeleton, Typography } from 'antd';
import { Suspense, lazy, useState } from 'react';
import { EmployeesPage } from './pages/EmployeesPage';
// Charts are only needed on the Insights tab, so load them on demand.
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));

type Tab = 'employees' | 'insights';

export default function App() {
  const [tab, setTab] = useState<Tab>('employees');
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Typography.Text strong style={{ color: '#fff', fontSize: 18, whiteSpace: 'nowrap' }}>ACME Salary</Typography.Text>
        <Menu theme="dark" mode="horizontal" selectedKeys={[tab]} style={{ flex: 1, minWidth: 0 }}
          onClick={(e) => setTab(e.key as Tab)}
          items={[
            { key: 'employees', icon: <TeamOutlined />, label: 'Employees' },
            { key: 'insights', icon: <BarChartOutlined />, label: 'Insights' },
          ]} />
      </Layout.Header>
      <Layout.Content style={{ padding: 24, maxWidth: 1280, width: '100%', margin: '0 auto' }}>
        {tab === 'employees' ? <EmployeesPage /> : <Suspense fallback={<Skeleton active />}><InsightsPage /></Suspense>}
      </Layout.Content>
    </Layout>
  );
}
