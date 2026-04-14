import { useEffect, useMemo, useState } from 'react';
import { App as AntdApp, Button, Form, Input, Modal, Select } from 'antd';

const CUSTOMER_API_URL = 'http://localhost:3001/customers';

function StatusBadge({ status }) {
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600 border border-emerald-200">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-500 border border-red-200">
      Inactive
    </span>
  );
}

export default function CustomerTable() {
  const [form] = Form.useForm();
  const { notification } = AntdApp.useApp();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      try {
        setIsLoading(true);
        setFetchError('');
        const response = await fetch(CUSTOMER_API_URL);
        if (!response.ok) {
          throw new Error('Cannot load customer data');
        }

        const data = await response.json();
        if (isMounted) {
          const loadedCustomers = Array.isArray(data) ? data : [];

          setCustomers(loadedCustomers);
          setTotalEntries(loadedCustomers.length);
          setTotalPages(Math.max(1, Math.ceil(loadedCustomers.length / 8)));
        }
      } catch (error) {
        if (isMounted) {
          setFetchError(error instanceof Error ? error.message : 'Cannot load customer data');
          setCustomers([]);
          setTotalEntries(0);
          setTotalPages(1);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const matchedCustomers = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.company.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === 'A-Z') {
      return [...matchedCustomers].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === 'Oldest') {
      return [...matchedCustomers].sort((a, b) => a.id - b.id);
    }

    return [...matchedCustomers].sort((a, b) => b.id - a.id);
  }, [customers, search, sortBy]);

  const openAddModal = () => {
    form.resetFields();
    form.setFieldValue('status', 'Active');
    setIsAddModalOpen(true);
  };

  const handleAddCustomer = async () => {
    try {
      const values = await form.validateFields();
      const maxId = customers.reduce((max, customer) => Math.max(max, Number(customer.id) || 0), 0);
      const nextId = maxId + 1;
      const newCustomer = { id: nextId, ...values };

      try {
        const response = await fetch(CUSTOMER_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomer),
        });

        if (response.ok) {
          const savedCustomer = await response.json();
          setCustomers((prevCustomers) => [savedCustomer, ...prevCustomers]);
        } else {
          setCustomers((prevCustomers) => [newCustomer, ...prevCustomers]);
        }
      } catch {
        setCustomers((prevCustomers) => [newCustomer, ...prevCustomers]);
      }

      notification.success({
        title: 'Thêm khách hàng thành công',
        description: `Khách hàng "${newCustomer.name}" đã được thêm vào danh sách.`,
        placement: 'topRight',
      });

      setTotalEntries((prev) => prev + 1);
      setIsAddModalOpen(false);
      form.resetFields();
    } catch {
      notification.error({
        title: 'Dữ liệu chưa hợp lệ',
        description: 'Vui lòng kiểm tra lại đầy đủ các trường trước khi thêm khách hàng.',
        placement: 'topRight',
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-800">All Customers</h2>
          <p className="text-xs font-semibold text-[#6160DC] mt-0.5">Active Members</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="primary" onClick={openAddModal} className="!h-[38px] !rounded-lg !bg-[#6160DC] hover:!bg-[#5756c5]">
            + Add Customer
          </Button>
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6160DC]/30 w-48 bg-gray-50"
            />
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="text-xs">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold text-gray-700 border-none bg-transparent focus:outline-none cursor-pointer"
            >
              <option>Newest</option>
              <option>Oldest</option>
              <option>A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-gray-500 py-4">Loading customers...</p>
        ) : fetchError ? (
          <p className="text-sm text-red-500 py-4">{fetchError}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Customer Name', 'Company', 'Phone Number', 'Email', 'Country', 'Status'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium text-gray-400 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={customer.avatar}
                        alt={customer.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{customer.company}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600 whitespace-nowrap">{customer.phone}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{customer.email}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{customer.country}</td>
                  <td className="py-3.5">
                    <StatusBadge status={customer.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Showing data 1 to {filtered.length} of{' '}
          <span className="font-semibold text-gray-600">{totalEntries.toLocaleString()}</span> entries
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {[1, 2, 3, 4].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                currentPage === page
                  ? 'bg-[#6160DC] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <span className="text-gray-400 text-xs px-1">...</span>
          <button
            onClick={() => setCurrentPage(totalPages)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
              currentPage === totalPages
                ? 'bg-[#6160DC] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {totalPages}
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <Modal
        title="Add New Customer"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={handleAddCustomer}
        okText="Add Customer"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            label="Customer Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter customer name' },
              { min: 2, message: 'Customer name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Jane Cooper" />
          </Form.Item>

          <Form.Item
            label="Company"
            name="company"
            rules={[
              { required: true, message: 'Please enter company' },
              { min: 2, message: 'Company must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Microsoft" />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[
              { required: true, message: 'Please enter phone number' },
              {
                pattern: /^(\+?\d[\d\s()-]{7,}\d)$/,
                message: 'Phone number format is invalid',
              },
            ]}
          >
            <Input placeholder="+84 912 345 678" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Email format is invalid' },
            ]}
          >
            <Input placeholder="jane@microsoft.com" />
          </Form.Item>

          <Form.Item
            label="Country"
            name="country"
            rules={[
              { required: true, message: 'Please enter country' },
              { min: 2, message: 'Country must be at least 2 characters' },
            ]}
          >
            <Input placeholder="United States" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Avatar URL"
            name="avatar"
            rules={[
              { required: true, message: 'Please enter avatar URL' },
              { type: 'url', message: 'Avatar must be a valid URL' },
            ]}
          >
            <Input placeholder="https://i.pravatar.cc/40?img=47" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
