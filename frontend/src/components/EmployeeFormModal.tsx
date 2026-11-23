import { AutoComplete, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import type { Employee, EmployeeInput } from '../api/types';
import { COUNTRY_CURRENCY, COUNTRY_NAMES } from '../countries';

interface FormValues {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  salary: number;
  hireDate: Dayjs;
}

interface Props {
  open: boolean;
  employee?: Employee | null;
  jobTitleOptions?: string[];
  departmentOptions?: string[];
  onSubmit: (input: EmployeeInput) => Promise<void>;
  onCancel: () => void;
}

export function EmployeeFormModal({ open, employee, jobTitleOptions = [], departmentOptions = [], onSubmit, onCancel }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const country = Form.useWatch('country', form);
  const isEdit = Boolean(employee);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (employee) form.setFieldsValue({ ...employee, hireDate: dayjs(employee.hireDate) });
  }, [open, employee, form]);

  const handleOk = async () => {
    const v = await form.validateFields().catch(() => null);
    if (!v) return;
    setSaving(true);
    try {
      await onSubmit({
        fullName: v.fullName.trim(),
        email: v.email.trim(),
        jobTitle: v.jobTitle.trim(),
        department: v.department.trim(),
        country: v.country,
        salary: v.salary,
        hireDate: v.hireDate.format('YYYY-MM-DD'),
      });
    } catch (e) {
      if (e instanceof ApiError && e.details.length) {
        form.setFields(e.details.map((d) => ({ name: d.field as keyof FormValues, errors: [d.message] })));
      } else if (e instanceof ApiError && e.status === 409) {
        form.setFields([{ name: 'email', errors: [e.message] }]);
      } else {
        throw e; // let the page show a generic error
      }
    } finally {
      setSaving(false);
    }
  };

  const toOptions = (list: string[]) => list.map((value) => ({ value }));

  return (
    <Modal
      title={isEdit ? 'Edit employee' : 'Add employee'}
      open={open}
      okText={isEdit ? 'Save changes' : 'Add employee'}
      confirmLoading={saving}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
      maskClosable={false}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item name="fullName" label="Full name" rules={[{ required: true, whitespace: true, message: 'Name is required' }]}>
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Invalid email' }]}>
          <Input maxLength={255} />
        </Form.Item>
        <Form.Item name="jobTitle" label="Job title" rules={[{ required: true, whitespace: true, message: 'Job title is required' }]}>
          <AutoComplete options={toOptions(jobTitleOptions)} filterOption={(i, o) => !!o?.value.toLowerCase().includes(i.toLowerCase())} />
        </Form.Item>
        <Form.Item name="department" label="Department" rules={[{ required: true, whitespace: true, message: 'Department is required' }]}>
          <AutoComplete options={toOptions(departmentOptions)} filterOption={(i, o) => !!o?.value.toLowerCase().includes(i.toLowerCase())} />
        </Form.Item>
        <Form.Item name="country" label="Country" rules={[{ required: true, message: 'Country is required' }]}>
          <Select placeholder="Select country" options={COUNTRY_NAMES.map((c) => ({ value: c, label: c }))} />
        </Form.Item>
        <Form.Item
          name="salary"
          label="Annual salary"
          extra={country ? `Paid in ${COUNTRY_CURRENCY[country]}` : 'Currency is set from the country'}
          rules={[
            { required: true, message: 'Salary is required' },
            { type: 'number', min: 0.01, message: 'Salary must be greater than 0' },
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={2} addonAfter={country ? COUNTRY_CURRENCY[country] : undefined} />
        </Form.Item>
        <Form.Item name="hireDate" label="Hire date" rules={[{ required: true, message: 'Hire date is required' }]}>
          <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs(), 'day')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
