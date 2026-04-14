import { useEffect, useMemo, useState } from 'react';
import { App, Button, Form, Input, InputNumber, Modal, Select } from 'antd';
import { useNavigate } from 'react-router-dom';

const PRODUCT_API_URL = 'http://localhost:3001/products';
const CATEGORY_API_URL = 'http://localhost:3001/categories';

function ProductStatusBadge({ status }) {
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

export default function ProductTable() {
  const [form] = Form.useForm();
  const { notification, modal } = App.useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setIsLoading(true);
        setFetchError('');
        const response = await fetch(PRODUCT_API_URL);
        if (!response.ok) {
          throw new Error('Cannot load product data');
        }

        const data = await response.json();
        if (isMounted) {
          const loadedProducts = Array.isArray(data) ? data : [];
          setProducts(loadedProducts);
          const localCategories = [...new Set(loadedProducts.map((product) => product.category).filter(Boolean))];
          setCategoryOptions(localCategories.map((name) => ({ label: name, value: name })));
        }
      } catch (error) {
        if (isMounted) {
          setFetchError(error instanceof Error ? error.message : 'Cannot load product data');
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await fetch(CATEGORY_API_URL);
        if (!response.ok) {
          return;
        }
        const categories = await response.json();
        if (isMounted && Array.isArray(categories)) {
          const seen = new Set();
          setCategoryOptions(
            categories
              .filter((category) => {
                if (seen.has(category.name)) return false;
                seen.add(category.name);
                return true;
              })
              .map((category) => ({ label: category.name, value: category.name }))
          );
        }
      } catch {
        // Ignore and keep local options from product data.
      }
    }

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const matchedProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === 'A-Z') {
      return [...matchedProducts].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === 'Oldest') {
      return [...matchedProducts].sort((a, b) => a.id - b.id);
    }

    return [...matchedProducts].sort((a, b) => b.id - a.id);
  }, [products, search, sortBy]);

  const openAddModal = () => {
    form.resetFields();
    form.setFieldValue('status', 'Active');
    setIsAddModalOpen(true);
  };

  const handleAddProduct = async () => {
    try {
      const values = await form.validateFields();
      const maxId = products.reduce((max, product) => Math.max(max, Number(product.id) || 0), 0);
      const nextId = maxId + 1;
      const newProduct = {
        id: nextId,
        ...values,
        sku: values.sku.toUpperCase(),
      };

      try {
        const response = await fetch(PRODUCT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct),
        });

        if (response.ok) {
          const savedProduct = await response.json();
          setProducts((prevProducts) => [savedProduct, ...prevProducts]);
        } else {
          setProducts((prevProducts) => [newProduct, ...prevProducts]);
        }
      } catch {
        setProducts((prevProducts) => [newProduct, ...prevProducts]);
      }

      notification.success({
        title: 'Thêm sản phẩm thành công',
        description: `Sản phẩm "${newProduct.name}" đã được thêm vào danh sách.`,
        placement: 'topRight',
      });

      setIsAddModalOpen(false);
      form.resetFields();
    } catch {
      notification.error({
        title: 'Dữ liệu chưa hợp lệ',
        description: 'Vui lòng kiểm tra lại các trường bắt buộc trước khi thêm sản phẩm.',
        placement: 'topRight',
      });
    }
  };

  const handleDeleteProduct = (product) => {
    modal.confirm({
      title: 'Xóa sản phẩm',
      content: `Bạn có chắc muốn xóa sản phẩm "${product.name}" không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await fetch(`${PRODUCT_API_URL}/${product.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Không thể xóa sản phẩm.');
          }

          notification.success({
            title: 'Xóa sản phẩm thành công',
            description: `Sản phẩm "${product.name}" đã được xóa.`,
            placement: 'topRight',
          });

          setProducts((prevProducts) =>
            prevProducts.filter((item) => String(item.id) !== String(product.id))
          );
        } catch (error) {
          notification.error({
            title: 'Xóa sản phẩm thất bại',
            description: error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi xóa sản phẩm.',
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
          <h2 className="text-lg font-bold text-gray-800">All Products</h2>
          <p className="text-xs font-semibold text-[#6160DC] mt-0.5">Manage product catalog</p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="primary" onClick={openAddModal} className="!h-[38px] !rounded-lg !bg-[#6160DC] hover:!bg-[#5756c5]">
            + Add Product
          </Button>

          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
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
          <p className="text-sm text-gray-500 py-4">Loading products...</p>
        ) : fetchError ? (
          <p className="text-sm text-red-500 py-4">{fetchError}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Product Name', 'Category', 'SKU', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium text-gray-400 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 pr-4 text-sm font-medium text-gray-800 whitespace-nowrap">{product.name}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{product.category}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{product.sku}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600 whitespace-nowrap">
                    {product.price.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{product.stock}</td>
                  <td className="py-3.5 pr-4">
                    <ProductStatusBadge status={product.status} />
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/product/edit/${product.id}`)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#6160DC] bg-[#efefff] rounded-md hover:bg-[#e3e3ff] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        title="Add New Product"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={handleAddProduct}
        okText="Add Product"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            label="Product Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter product name' },
              { min: 2, message: 'Product name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="MacBook Air M3" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select
              placeholder="Select category"
              options={categoryOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="SKU"
            name="sku"
            rules={[
              { required: true, message: 'Please enter SKU' },
              { pattern: /^[A-Z0-9-]{4,20}$/i, message: 'SKU only includes letters, numbers, and "-"' },
            ]}
          >
            <Input placeholder="MBA-M3-13" />
          </Form.Item>

          <Form.Item
            label="Price (VND)"
            name="price"
            rules={[
              { required: true, message: 'Please enter price' },
              { type: 'number', min: 1000, message: 'Price must be at least 1,000 VND' },
            ]}
          >
            <InputNumber className="!w-full" min={0} placeholder="32990000" />
          </Form.Item>

          <Form.Item
            label="Stock"
            name="stock"
            rules={[
              { required: true, message: 'Please enter stock quantity' },
              { type: 'number', min: 0, message: 'Stock must be 0 or greater' },
            ]}
          >
            <InputNumber className="!w-full" min={0} placeholder="24" />
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
        </Form>
      </Modal>
    </div>
  );
}
