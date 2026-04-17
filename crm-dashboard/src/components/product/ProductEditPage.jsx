import { useEffect, useState } from 'react';
import { App, Button, Form, Input, InputNumber, Select, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ProductImage from '../shared/ProductImage';
import { buildCategoryOptions, buildProductPayload, validateActiveStock, validateImageUrl } from './product.utils';

const PRODUCT_API_URL = 'http://localhost:3001/products';
const CATEGORY_API_URL = 'http://localhost:3001/categories';

export default function ProductEditPage() {
  const [form] = Form.useForm();
  const { notification, modal } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [previewImg, setPreviewImg] = useState('');

  const handleBack = () => {
    if (isFormDirty) {
      modal.confirm({
        title: 'Bỏ thay đổi?',
        content: 'Bạn có thay đổi chưa được lưu. Rời khỏi trang sẽ mất toàn bộ chỉnh sửa.',
        okText: 'Rời khỏi',
        cancelText: 'Ở lại',
        okButtonProps: { danger: true },
        onOk: () => navigate('/admin/product'),
      });
    } else {
      navigate('/admin/product');
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [productResponse, categoryResponse] = await Promise.all([
          fetch(`${PRODUCT_API_URL}/${id}`),
          fetch(CATEGORY_API_URL),
        ]);

        if (!productResponse.ok) {
          throw new Error('Không tìm thấy sản phẩm để chỉnh sửa.');
        }

        const productData = await productResponse.json();
        const categoryData = categoryResponse.ok ? await categoryResponse.json() : [];

        if (isMounted) {
          setProduct(productData);
          form.setFieldsValue({
            name: productData.name,
            category: productData.category,
            sku: productData.sku,
            price: productData.price,
            stock: productData.stock,
            status: productData.status,
            img: productData.img || '',
          });
          setPreviewImg(productData.img || '');
          setCategoryOptions(buildCategoryOptions(categoryData));
        }
      } catch (error) {
        notification.error({
          title: 'Không tải được dữ liệu sản phẩm',
          description: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.',
          placement: 'topRight',
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [form, id]);

  const handleSave = async () => {
    if (!product) return;
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      const payload = buildProductPayload(product, values);

      const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Không thể cập nhật sản phẩm.');
      }

      setIsFormDirty(false);
      notification.success({
        title: 'Cập nhật sản phẩm thành công',
        description: `Sản phẩm "${payload.name}" đã được cập nhật.`,
        placement: 'topRight',
      });
      navigate('/admin/product');
    } catch (error) {
      notification.error({
        title: 'Cập nhật sản phẩm thất bại',
        description: error instanceof Error ? error.message : 'Vui lòng kiểm tra lại thông tin sản phẩm.',
        placement: 'topRight',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const imageUrlRules = [
    { required: true, message: 'Vui lòng nhập URL hình ảnh' },
    { type: 'url', message: 'Vui lòng nhập URL hợp lệ (http/https)' },
    {
      validator: (_, value) => {
        return validateImageUrl(value);
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center">
  
        <Spin />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm">
  
        <p className="text-sm text-red-500 mb-4">Không tìm thấy sản phẩm.</p>
        <Button onClick={() => navigate('/admin/product')}>Back to Product</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">Edit Product #{product.id}</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Back</Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onValuesChange={(changed) => {
          setIsFormDirty(true);
          if ('img' in changed) setPreviewImg(changed.img || '');
          if (changed.status === 'Inactive') {
            form.setFieldValue('stock', 0);
          }
          if ('status' in changed || 'stock' in changed) {
            form.validateFields(['stock']).catch(() => {});
          }
        }}
      >
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
          <InputNumber className="!w-full" min={0} />
        </Form.Item>

        <Form.Item
          label="Stock"
          name="stock"
          rules={[
            { required: true, message: 'Please enter stock quantity' },
            { type: 'number', min: 0, message: 'Stock must be 0 or greater' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const status = getFieldValue('status');
                return validateActiveStock(status, value);
              },
            }),
          ]}
        >
          <InputNumber className="!w-full" min={0} />
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
            label="Hình ảnh (URL)"
            name="img"
            rules={imageUrlRules}
          >
            <Input placeholder="https://example.com/product.jpg" allowClear />
          </Form.Item>
          {previewImg && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1.5">Xem trước:</p>
              <ProductImage
                src={previewImg}
                alt="preview"
                className="w-full h-48 rounded-xl border border-gray-100"
                iconSize="text-5xl"
              />
            </div>
          )}

        <div className="flex items-center gap-3">
          <Button type="primary" icon={<SaveOutlined />} loading={isSubmitting} onClick={handleSave}>
            Save Product
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Cancel</Button>
        </div>
      </Form>
    </div>
  );
}
