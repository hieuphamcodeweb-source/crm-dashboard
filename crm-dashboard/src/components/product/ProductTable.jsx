import { useEffect, useMemo, useState } from 'react';
import { App, Button, Form, Input, InputNumber, Modal, Select, Tooltip } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ProductImage from '../shared/ProductImage';

const PRODUCT_API_URL = 'http://localhost:3001/products';
const CATEGORY_API_URL = 'http://localhost:3001/categories';
const PAGE_SIZE = 10;

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
  const [previewImg, setPreviewImg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
        if (!response.ok) throw new Error('Cannot load product data');
        const data = await response.json();
        if (isMounted) {
          const loadedProducts = Array.isArray(data) ? data : [];
          setProducts(loadedProducts);
          const localCategories = [...new Set(loadedProducts.map((p) => p.category).filter(Boolean))];
          setCategoryOptions(localCategories.map((name) => ({ label: name, value: name })));
        }
      } catch (error) {
        if (isMounted) {
          setFetchError(error instanceof Error ? error.message : 'Cannot load product data');
          setProducts([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProducts();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const response = await fetch(CATEGORY_API_URL);
        if (!response.ok) return;
        const categories = await response.json();
        if (isMounted && Array.isArray(categories)) {
          const seen = new Set();
          setCategoryOptions(
            categories
              .filter((c) => { if (seen.has(c.name)) return false; seen.add(c.name); return true; })
              .map((c) => ({ label: c.name, value: c.name }))
          );
        }
      } catch { /* giữ options từ product data */ }
    }
    loadCategories();
    return () => { isMounted = false; };
  }, []);

  // Reset về trang 1 khi search hoặc sort thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  const filteredProducts = useMemo(() => {
    const matched = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === 'A-Z') return [...matched].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'Oldest') return [...matched].sort((a, b) =>
      a.created_at && b.created_at ? new Date(a.created_at) - new Date(b.created_at) : Number(a.id) - Number(b.id)
    );
    return [...matched].sort((a, b) =>
      a.created_at && b.created_at ? new Date(b.created_at) - new Date(a.created_at) : Number(b.id) - Number(a.id)
    );
  }, [products, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  // Tạo dãy số trang để hiển thị (tối đa 5 trang xung quanh trang hiện tại)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, currentPage]);
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      if (i > 0 && i <= totalPages) pages.add(i);
    }
    return [...pages].sort((a, b) => a - b);
  }, [totalPages, currentPage]);

  const openAddModal = () => {
    form.resetFields();
    form.setFieldValue('status', 'Active');
    setPreviewImg('');
    setIsAddModalOpen(true);
  };

  const handleCancelAdd = () => {
    if (form.isFieldsTouched()) {
      modal.confirm({
        title: 'Hủy thêm sản phẩm?',
        content: 'Dữ liệu đã nhập sẽ bị mất. Bạn có chắc muốn hủy không?',
        okText: 'Hủy thêm',
        cancelText: 'Tiếp tục nhập',
        okButtonProps: { danger: true },
        onOk: () => { setIsAddModalOpen(false); form.resetFields(); setPreviewImg(''); },
      });
    } else {
      setIsAddModalOpen(false);
      form.resetFields();
      setPreviewImg('');
    }
  };

  const handleAddProduct = async () => {
    try {
      const values = await form.validateFields();
      const maxId = products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
      const newProduct = { id: maxId + 1, ...values, sku: values.sku.toUpperCase(), created_at: new Date().toISOString() };
      try {
        const response = await fetch(PRODUCT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct),
        });
        if (response.ok) {
          const saved = await response.json();
          setProducts((prev) => [saved, ...prev]);
        } else {
          setProducts((prev) => [newProduct, ...prev]);
        }
      } catch {
        setProducts((prev) => [newProduct, ...prev]);
      }
      notification.success({
        title: 'Thêm sản phẩm thành công',
        description: `Sản phẩm "${newProduct.name}" đã được thêm vào danh sách.`,
        placement: 'topRight',
      });
      setIsAddModalOpen(false);
      form.resetFields();
      setPreviewImg('');
      setCurrentPage(1);
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
          const response = await fetch(`${PRODUCT_API_URL}/${product.id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Không thể xóa sản phẩm.');
          notification.success({
            title: 'Xóa sản phẩm thành công',
            description: `Sản phẩm "${product.name}" đã được xóa.`,
            placement: 'topRight',
          });
          setProducts((prev) => prev.filter((item) => String(item.id) !== String(product.id)));
        } catch (error) {
          notification.error({
            title: 'Xóa sản phẩm thất bại',
            description: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.',
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            className="!h-[38px] !rounded-lg !bg-[#6160DC] hover:!bg-[#5756c5]"
          >
            Add Product
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
          <p className="text-sm text-gray-500 py-4">Loading products...</p>
        ) : fetchError ? (
          <p className="text-sm text-red-500 py-4">{fetchError}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['', 'Product Name', 'Category', 'SKU', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium text-gray-400 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="py-2 pr-3 w-10">
                    <ProductImage
                      src={product.img}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg"
                      iconSize="text-lg"
                    />
                  </td>
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
                    <div className="flex items-center gap-1.5">
                      <Tooltip title="Xem chi tiết">
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/admin/product/${product.id}`)}
                          className="!text-blue-500 !border-blue-200 !bg-blue-50 hover:!bg-blue-100"
                        />
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/admin/product/edit/${product.id}`)}
                          className="!text-[#6160DC] !border-[#d0d0f7] !bg-[#efefff] hover:!bg-[#e3e3ff]"
                        />
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteProduct(product)}
                        />
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination footer */}
      {!isLoading && !fetchError && filteredProducts.length > 0 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Hiển thị{' '}
            <span className="font-semibold text-gray-600">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}
            </span>{' '}
            / <span className="font-semibold text-gray-600">{filteredProducts.length}</span> sản phẩm
          </p>

          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Page numbers */}
            {pageNumbers.map((page, idx) => {
              const prev = pageNumbers[idx - 1];
              return (
                <span key={page} className="flex items-center gap-1">
                  {prev && page - prev > 1 && (
                    <span className="text-gray-300 text-xs px-0.5">…</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-[#6160DC] text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                </span>
              );
            })}

            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Modal
        title="Add New Product"
        open={isAddModalOpen}
        onCancel={handleCancelAdd}
        onOk={handleAddProduct}
        okText="Add Product"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          onValuesChange={(changed) => {
            if ('img' in changed) setPreviewImg(changed.img || '');
          }}
        >
          <Form.Item label="Product Name" name="name" rules={[
            { required: true, message: 'Please enter product name' },
            { min: 2, message: 'Product name must be at least 2 characters' },
          ]}>
            <Input placeholder="MacBook Air M3" />
          </Form.Item>
          <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Please select category' }]}>
            <Select placeholder="Select category" options={categoryOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item label="SKU" name="sku" rules={[
            { required: true, message: 'Please enter SKU' },
            { pattern: /^[A-Z0-9-]{4,20}$/i, message: 'SKU only includes letters, numbers, and "-"' },
          ]}>
            <Input placeholder="MBA-M3-13" />
          </Form.Item>
          <Form.Item label="Price (VND)" name="price" rules={[
            { required: true, message: 'Please enter price' },
            { type: 'number', min: 1000, message: 'Price must be at least 1,000 VND' },
          ]}>
            <InputNumber className="!w-full" min={0} placeholder="32990000" />
          </Form.Item>
          <Form.Item label="Stock" name="stock" rules={[
            { required: true, message: 'Please enter stock quantity' },
            { type: 'number', min: 0, message: 'Stock must be 0 or greater' },
          ]}>
            <InputNumber className="!w-full" min={0} placeholder="24" />
          </Form.Item>
          <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Please select status' }]}>
            <Select options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} />
          </Form.Item>
          <Form.Item
            label="Hình ảnh (URL)"
            name="img"
            rules={[{ type: 'url', message: 'Vui lòng nhập URL hợp lệ' }]}
          >
            <Input placeholder="https://example.com/product.jpg" allowClear />
          </Form.Item>
          {previewImg && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1.5">Xem trước:</p>
              <ProductImage
                src={previewImg}
                alt="preview"
                className="w-full h-40 rounded-xl border border-gray-100"
                iconSize="text-4xl"
              />
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
