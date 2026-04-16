import { useEffect, useMemo, useState } from 'react';
import { App as AntdApp, Button, Form, Input, Modal, Select, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';

const USER_API_URL = 'http://localhost:3001/users';
const PAGE_SIZE = 8;

function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
      User
    </span>
  );
}

export default function CustomerTable() {
  const [form] = Form.useForm();
  const { notification, modal } = AntdApp.useApp();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        setIsLoading(true);
        setFetchError('');
        const response = await fetch(USER_API_URL);
        if (!response.ok) {
          throw new Error('Cannot load user data');
        }

        const data = await response.json();
        if (isMounted) {
          const loadedUsers = Array.isArray(data) ? data : [];
          setUsers(loadedUsers);
        }
      } catch (error) {
        if (isMounted) {
          setFetchError(error instanceof Error ? error.message : 'Cannot load user data');
          setUsers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  const filteredUsers = useMemo(() => {
    const matchedUsers = users.filter(
      (user) =>
        (user.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (user.role || '').toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === 'A-Z') {
      return [...matchedUsers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    if (sortBy === 'Oldest') {
      return [...matchedUsers].sort((a, b) =>
        a.created_at && b.created_at
          ? new Date(a.created_at) - new Date(b.created_at)
          : String(a.id).localeCompare(String(b.id))
      );
    }

    return [...matchedUsers].sort((a, b) =>
      a.created_at && b.created_at
        ? new Date(b.created_at) - new Date(a.created_at)
        : String(b.id).localeCompare(String(a.id))
    );
  }, [users, search, sortBy]);

  const totalEntries = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    if (isAddModalOpen) {
      form.resetFields();
      form.setFieldsValue({ role: 'user' });
    }
  }, [isAddModalOpen, form]);

  const handleCancelAdd = () => {
    if (form.isFieldsTouched()) {
      modal.confirm({
        title: 'Hủy thêm người dùng?',
        content: 'Dữ liệu đã nhập sẽ bị mất. Bạn có chắc muốn hủy không?',
        okText: 'Hủy thêm',
        cancelText: 'Tiếp tục nhập',
        okButtonProps: { danger: true },
        onOk: () => {
          setIsAddModalOpen(false);
          form.resetFields();
        },
      });
    } else {
      setIsAddModalOpen(false);
      form.resetFields();
    }
  };

  const handleAddUser = async () => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();
      const normalizedEmail = values.email.toLowerCase();
      const hasEmail = users.some((u) => (u.email || '').toLowerCase() === normalizedEmail);
      if (hasEmail) {
        throw new Error('Email đã tồn tại trong hệ thống.');
      }

      const nowIso = new Date().toISOString();
      const payload = {
        name: values.name,
        email: normalizedEmail,
        password: values.password,
        role: values.role,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const response = await fetch(USER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Không thể thêm người dùng.');
      }
      const savedUser = await response.json();
      setUsers((prev) => [savedUser, ...prev]);

      notification.success({
        title: 'Thêm người dùng thành công',
        description: `Tài khoản "${savedUser.email}" đã được tạo.`,
        placement: 'topRight',
      });

      setIsAddModalOpen(false);
      form.resetFields();
      setCurrentPage(1);
    } catch (error) {
      notification.error({
        title: 'Thêm người dùng thất bại',
        description: error instanceof Error ? error.message : 'Vui lòng kiểm tra lại dữ liệu.',
        placement: 'topRight',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRole = (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    modal.confirm({
      title: 'Chuyển quyền tài khoản',
      content: `Bạn có chắc muốn đổi "${user.email}" từ ${user.role} sang ${nextRole} không?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await fetch(`${USER_API_URL}/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: nextRole,
              updated_at: new Date().toISOString(),
            }),
          });
          if (!response.ok) {
            throw new Error('Không thể cập nhật quyền người dùng.');
          }
          setUsers((prev) =>
            prev.map((item) => (String(item.id) === String(user.id) ? { ...item, role: nextRole } : item))
          );
          notification.success({
            title: 'Cập nhật quyền thành công',
            description: `${user.email} đã được chuyển sang quyền ${nextRole}.`,
            placement: 'topRight',
          });
        } catch (error) {
          notification.error({
            title: 'Cập nhật quyền thất bại',
            description: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.',
            placement: 'topRight',
          });
        }
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-800">All Users</h2>
          <p className="text-xs font-semibold text-[#6160DC] mt-0.5">Manage account roles</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            className="!h-[38px] !rounded-lg !bg-[#6160DC] hover:!bg-[#5756c5]"
          >
            Add User
          </Button>
          {/* Search */}
          <div className="relative">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
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
          <p className="text-sm text-gray-500 py-4">Loading users...</p>
        ) : fetchError ? (
          <p className="text-sm text-red-500 py-4">{fetchError}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Email', 'Role', 'Created At', 'Actions'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium text-gray-400 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#6160DC]/10 text-xs font-semibold text-[#6160DC]">
                        {(user.name || user.email || 'U').trim().charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{user.name || 'No name'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{user.email}</td>
                  <td className="py-3.5">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600 whitespace-nowrap">
                    {user.created_at ? new Date(user.created_at).toLocaleString('vi-VN') : '--'}
                  </td>
                  <td className="py-3.5 pr-4">
                    <Tooltip title="Chuyển quyền admin/user">
                      <Button
                        size="small"
                        icon={<SwapOutlined />}
                        onClick={() => handleToggleRole(user)}
                        className="!text-[#6160DC] !border-[#d0d0f7] !bg-[#efefff] hover:!bg-[#e3e3ff]"
                      >
                        {user.role === 'admin' ? 'Đổi sang user' : 'Đổi sang admin'}
                      </Button>
                    </Tooltip>
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
          Showing data {totalEntries === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{' '}
          {Math.min(currentPage * PAGE_SIZE, totalEntries)} of{' '}
          <span className="font-semibold text-gray-600">{totalEntries.toLocaleString()}</span> entries
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
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
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <Modal
        title="Add New User"
        open={isAddModalOpen}
        onCancel={handleCancelAdd}
        onOk={handleAddUser}
        okText="Add User"
        cancelText="Cancel"
        confirmLoading={isSubmitting}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter name' },
              { min: 2, message: 'Name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Jane Cooper" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Email format is invalid' },
            ]}
          >
            <Input placeholder="jane@example.com" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password placeholder="******" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            initialValue="user"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select
              options={[
                { label: 'User', value: 'user' },
                { label: 'Admin', value: 'admin' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
