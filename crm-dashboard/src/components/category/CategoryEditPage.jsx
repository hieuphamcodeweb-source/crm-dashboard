import { useEffect, useRef, useState } from 'react';
import { App, Button, Form, Input, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const CATEGORY_API_URL = 'http://localhost:3001/categories';

function slugify(input = '') {
  return input
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function CategoryEditPage() {
  const [form] = Form.useForm();
  const { notification, modal } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const initialValuesRef = useRef(null);

  // So sánh giá trị hiện tại với giá trị gốc để biết có thay đổi không
  const hasChanges = () => {
    if (!initialValuesRef.current) return false;
    const current = form.getFieldsValue();
    const initial = initialValuesRef.current;
    return (
      current.name?.trim() !== initial.name ||
      slugify(current.slug) !== initial.slug
    );
  };

  const handleBack = () => {
    if (hasChanges()) {
      modal.confirm({
        title: 'Bỏ thay đổi?',
        content: 'Bạn có thay đổi chưa được lưu. Rời khỏi trang sẽ mất toàn bộ chỉnh sửa.',
        okText: 'Rời khỏi',
        cancelText: 'Ở lại',
        okButtonProps: { danger: true },
        onOk: () => navigate('/admin/category'),
      });
    } else {
      navigate('/admin/category');
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const [catRes, allRes] = await Promise.all([
          fetch(`${CATEGORY_API_URL}/${id}`),
          fetch(CATEGORY_API_URL),
        ]);
        if (!catRes.ok) throw new Error('Không tìm thấy danh mục.');
        const catData = await catRes.json();
        const allData = allRes.ok ? await allRes.json() : [];
        if (isMounted) {
          setCategory(catData);
          setAllCategories(Array.isArray(allData) ? allData : []);
          const initial = { name: catData.name, slug: catData.slug };
          form.setFieldsValue(initial);
          initialValuesRef.current = initial;
        }
      } catch (error) {
        notification.error({
          title: 'Không tải được dữ liệu',
          description: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.',
          placement: 'topRight',
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [form, id]);

  const handleSave = async () => {
    if (!category) return;
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      const payload = {
        ...category,
        name: values.name.trim(),
        slug: slugify(values.slug),
        updated_at: new Date().toISOString(),
      };
      const response = await fetch(`${CATEGORY_API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Không thể cập nhật danh mục.');
      notification.success({
        title: 'Cập nhật danh mục thành công',
        description: `Danh mục "${payload.name}" đã được cập nhật.`,
        placement: 'topRight',
      });
      navigate('/admin/category');
    } catch (error) {
      notification.error({
        title: 'Cập nhật danh mục thất bại',
        description: error instanceof Error ? error.message : 'Vui lòng kiểm tra lại thông tin.',
        placement: 'topRight',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <p className="text-sm text-red-500 mb-4">Không tìm thấy danh mục.</p>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/category')}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Edit Category</h2>
          <p className="text-xs text-gray-400">ID: #{category.id}</p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Back</Button>
      </div>

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
                const duplicated = allCategories.some(
                  (c) =>
                    c.name.toLowerCase() === value.trim().toLowerCase() &&
                    String(c.id) !== String(id)
                );
                return duplicated
                  ? Promise.reject(new Error('Category name already exists'))
                  : Promise.resolve();
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
              message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang',
            },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const duplicated = allCategories.some(
                  (c) =>
                    c.slug.toLowerCase() === value.toLowerCase() &&
                    String(c.id) !== String(id)
                );
                return duplicated
                  ? Promise.reject(new Error('Slug already exists'))
                  : Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="vd: dien-thoai-cao-cap" />
        </Form.Item>

        <div className="flex items-center gap-3 mt-2">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSubmitting}
            onClick={handleSave}
            className="!bg-[#6160DC] hover:!bg-[#5756c5]"
          >
            Save Category
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}
