import { useEffect, useState } from 'react';
import { App, Button, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const PRODUCT_API_URL = 'http://localhost:3001/products';

function DetailRow({ label, value }) {
  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <div className="text-sm font-semibold text-gray-800">{value ?? '—'}</div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        setIsLoading(true);
        const response = await fetch(`${PRODUCT_API_URL}/${id}`);
        if (!response.ok) throw new Error('Không tìm thấy sản phẩm.');
        const data = await response.json();
        if (isMounted) setProduct(data);
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
    loadProduct();
    return () => { isMounted = false; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <p className="text-sm text-red-500 mb-4">Không tìm thấy sản phẩm.</p>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/product')}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/product')}>
            Quay lại
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Chi tiết sản phẩm</h2>
            <p className="text-xs text-gray-400">ID: #{product.id}</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/product/edit/${product.id}`)}
          className="!bg-[#6160DC] hover:!bg-[#5756c5]"
        >
          Chỉnh sửa
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
        <DetailRow label="Tên sản phẩm" value={product.name} />
        <DetailRow label="Danh mục" value={product.category} />
        <DetailRow label="SKU" value={
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{product.sku}</span>
        } />
        <DetailRow label="Giá bán" value={
          <span className="text-[#6160DC] font-bold">
            {product.price?.toLocaleString('vi-VN')}đ
          </span>
        } />
        <DetailRow label="Tồn kho" value={
          <span className={product.stock === 0 ? 'text-red-500' : 'text-gray-800'}>
            {product.stock} sản phẩm
          </span>
        } />
        <DetailRow label="Trạng thái" value={
          <Tag color={product.status === 'Active' ? 'success' : 'error'}>
            {product.status}
          </Tag>
        } />
        {product.created_at && (
          <DetailRow
            label="Ngày tạo"
            value={new Date(product.created_at).toLocaleString('vi-VN')}
          />
        )}
      </div>
    </div>
  );
}
