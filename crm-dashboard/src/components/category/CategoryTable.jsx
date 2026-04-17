import { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Form, Input, Modal, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  buildCategoryPayload,
  filterAndSortCategories,
  formatDateTime,
  isDuplicateCategoryName,
  isDuplicateCategorySlug,
  slugify,
} from './category.utils';

const CATEGORY_API_URL = 'http://localhost:3001/categories';
const POLLING_INTERVAL_MS = 5000;
const REFETCH_OPTIONS = { cache: 'no-store' };

export default function CategoryTable() {
  const [form] = Form.useForm();
  const { notification, modal } = App.useApp();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setFetchError('');
      const response = await fetch(CATEGORY_API_URL, REFETCH_OPTIONS);
      if (!response.ok) {
        throw new Error('Không thể tải danh mục. Hãy chạy json-server với npm run server.');
      }

      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Không thể tải danh mục.');
      if (!silent) {
        setCategories([]);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadCategories();
    const pollingId = window.setInterval(() => {
      loadCategories({ silent: true });
    }, POLLING_INTERVAL_MS);
    const handleWindowFocus = () => {
      loadCategories({ silent: true });
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.clearInterval(pollingId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    return filterAndSortCategories(categories, search, sortBy);
  }, [categories, search, sortBy]);

  const openAddModal = () => {
    form.resetFields();
    setIsAddModalOpen(true);
  };

  const handleCancelAdd = () => {
    if (form.isFieldsTouched()) {
      modal.confirm({
        title: 'Hủy thêm danh mục?',
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

  const handleAddCategory = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      const payload = buildCategoryPayload(categories, values);

      const response = await fetch(CATEGORY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Không thể lưu danh mục vào db.json.');
      }

      const newCategory = await response.json();
      setCategories((prev) => [newCategory, ...prev]);

      notification.success({
        title: 'Thêm danh mục thành công',
        description: `Danh mục "${newCategory.name}" đã được lưu vào db.json.`,
        placement: 'topRight',
      });

      setIsAddModalOpen(false);
      form.resetFields();
    } catch (error) {
      notification.error({
        title: 'Thêm danh mục thất bại',
        description: error instanceof Error ? error.message : 'Vui lòng kiểm tra lại dữ liệu danh mục và thử lại.',
        placement: 'topRight',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (category) => {
    modal.confirm({
      title: 'Xóa danh mục',
      content: `Bạn có chắc muốn xóa danh mục "${category.name}" không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await fetch(`${CATEGORY_API_URL}/${category.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Không thể xóa danh mục khỏi db.json.');
          }

          notification.success({
            title: 'Xóa danh mục thành công',
            description: `Danh mục "${category.name}" đã được xóa.`,
            placement: 'topRight',
          });

          setCategories((prev) => prev.filter((item) => String(item.id) !== String(category.id)));
        } catch (error) {
          notification.error({
            title: 'Xóa danh mục thất bại',
            description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa danh mục.',
            placement: 'topRight',
          });
        }
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-800">All Categories</h2>
          <p className="text-xs font-semibold text-[#6160DC] mt-0.5">Manage product categories</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            className="!h-[38px] !rounded-lg !bg-[#6160DC] hover:!bg-[#5756c5]"
          >
            Add Category
          </Button>
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

      <div className="mt-4 overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-gray-500 py-4">Loading categories...</p>
        ) : fetchError ? (
          <p className="text-sm text-red-500 py-4">{fetchError}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['ID', 'Name', 'Slug', 'Created At', 'Updated At', 'Actions'].map((header) => (
                  <th key={header} className="pb-3 text-left text-xs font-medium text-gray-400 pr-4 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category, index) => (
                <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{index + 1}</td>
                  <td className="py-3.5 pr-4 text-sm font-medium text-gray-800">{category.name}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{category.slug}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(category.created_at)}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(category.updated_at)}</td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Tooltip title="Chỉnh sửa">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/admin/category/edit/${category.id}`)}
                          className="!text-[#6160DC] !border-[#d0d0f7] !bg-[#efefff] hover:!bg-[#e3e3ff]"
                        />
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCategory(category)} />
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        title="Add New Category"
        open={isAddModalOpen}
        onCancel={handleCancelAdd}
        onOk={handleAddCategory}
        okText="Add Category"
        cancelText="Cancel"
        confirmLoading={isSubmitting}
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            label="Category Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter category name' },
              { min: 2, message: 'Category name must be at least 2 characters' },
              { max: 100, message: 'Category name must be at most 100 characters' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const duplicated = isDuplicateCategoryName(categories, value);
                  return duplicated ? Promise.reject(new Error('Category name already exists')) : Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="Laptop" />
          </Form.Item>

          <Form.Item
            label="Slug"
            name="slug"
            normalize={(value) => slugify(value)}
            rules={[
              { required: true, message: 'Please enter slug' },
              {
                pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: 'Slug chỉ gồm chữ cái, số và dấu gạch ngang',
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const duplicated = isDuplicateCategorySlug(categories, value);
                  return duplicated ? Promise.reject(new Error('Slug already exists')) : Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="vd: dien-thoai-cao-cap" />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
