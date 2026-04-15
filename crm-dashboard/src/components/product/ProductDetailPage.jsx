import { useEffect, useState } from 'react';
import { App, Button, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ProductImage from '../shared/ProductImage';

const PRODUCT_API_URL = 'http://localhost:3001/products';

function InfoRow({ label, children }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm font-semibold text-gray-800">{children ?? '—'}</div>
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
      <div className="bg-white rounded-2xl shadow-sm flex items-center justify-center min-h-[420px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <p className="text-sm text-red-500 mb-4">Không tìm thấy sản phẩm.</p>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/product')}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative">
      {/* Back button — góc trên phải */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/product')}
        >
          Back
        </Button>
      </div>

      {/* Layout 2 cột */}
      <div className="flex min-h-[460px]">

        {/* ── CỘT TRÁI — Ảnh ── */}
        <div className="w-[38%] flex-shrink-0">
          <ProductImage
            src={product.img}
            alt={product.name}
            className="w-full h-full"
            iconSize="text-7xl"
          />
        </div>

        {/* ── CỘT PHẢI — Thông tin ── */}
        <div className="flex-1 flex flex-col p-8 pt-6">

          {/* Tên & badge */}
          <div className="mb-5 pr-24">
            <div className="flex items-center gap-2 mb-2">
              <Tag color={product.status === 'Active' ? 'success' : 'error'} className="!text-xs">
                {product.status}
              </Tag>
              <Tag color="purple" className="!text-xs">{product.category}</Tag>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{product.name}</h2>
            <p className="text-xs text-gray-400 mt-1">ID: #{product.id}</p>
          </div>

          {/* Thông tin chi tiết */}
          <div className="flex-1">
            <InfoRow label="Giá bán">
              <span className="text-xl font-extrabold text-[#6160DC]">
                {product.price?.toLocaleString('vi-VN')}đ
              </span>
            </InfoRow>

            <InfoRow label="SKU">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs tracking-wider">
                {product.sku}
              </span>
            </InfoRow>

            <InfoRow label="Danh mục">
              {product.category}
            </InfoRow>

            <InfoRow label="Tồn kho">
              <span className={product.stock === 0 ? 'text-red-500' : 'text-gray-800'}>
                {product.stock} sản phẩm
              </span>
            </InfoRow>

            {product.created_at && (
              <InfoRow label="Ngày tạo">
                {new Date(product.created_at).toLocaleString('vi-VN')}
              </InfoRow>
            )}
          </div>

          {/* Edit button — góc dưới phải */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/product/edit/${product.id}`)}
              className="!bg-[#6160DC] hover:!bg-[#5756c5]"
            >
              Chỉnh sửa
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
