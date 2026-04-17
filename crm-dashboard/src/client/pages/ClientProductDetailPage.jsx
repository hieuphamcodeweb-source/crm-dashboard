import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Button, InputNumber, Modal, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, MinusOutlined, PlusOutlined, ShoppingCartOutlined, CheckOutlined } from '@ant-design/icons';
import ProductImage from '../../components/shared/ProductImage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const PRODUCT_API_URL = 'http://localhost:3001/products';
const POLLING_INTERVAL_MS = 5000;
const REFETCH_OPTIONS = { cache: 'no-store' };

export default function ClientProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal chọn số lượng
  const [modalOpen, setModalOpen] = useState(false);
  const [qty, setQty] = useState(1);

  const cartItem = cartItems.find((item) => String(item.id) === String(id));
  const cartQty = Number(cartItem?.quantity || 0);

  const loadProduct = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      const res = await fetch(`${PRODUCT_API_URL}/${id}`, REFETCH_OPTIONS);
      if (!res.ok) throw new Error('Không tìm thấy sản phẩm.');
      const data = await res.json();
      setProduct(data);
      setError('');
    } catch (err) {
      setProduct(null);
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
    const pollingId = window.setInterval(() => {
      loadProduct({ silent: true });
    }, POLLING_INTERVAL_MS);
    const handleWindowFocus = () => {
      loadProduct({ silent: true });
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.clearInterval(pollingId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadProduct]);

  const openAddModal = () => {
    if (!isAuthenticated) {
      notification.info({
        title: 'Vui lòng đăng nhập',
        description: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.',
        placement: 'topRight',
      });
      navigate('/client/login', { state: { from: `/client/products/${id}` } });
      return;
    }
    if (product) {
      const totalStock = Number(product.stock || 0);
      const remaining = Math.max(0, totalStock - cartQty);
      if (remaining <= 0) {
        notification.warning({
          title: 'Số lượng tồn kho đã đầy',
          description: `Bạn đã có ${cartQty} sản phẩm này trong giỏ, đã đạt giới hạn tồn kho.`,
          placement: 'topRight',
        });
        return;
      }
      setQty(Math.min(1, remaining) || 1);
    } else {
      setQty(1);
    }
    setModalOpen(true);
  };

  const handleConfirmAdd = () => {
    if (!product) return;
    const totalStock = Number(product.stock || 0);
    const remaining = Math.max(0, totalStock - cartQty);
    if (remaining <= 0) {
      notification.warning({
        title: 'Số lượng tồn kho đã đầy',
        description: `Bạn đã có ${cartQty} sản phẩm này trong giỏ, không thể thêm nữa.`,
        placement: 'topRight',
      });
      setModalOpen(false);
      return;
    }
    if (qty > remaining) {
      notification.warning({
        title: 'Vượt quá số lượng tồn kho',
        description: `Bạn chỉ có thể thêm tối đa ${remaining} sản phẩm nữa.`,
        placement: 'topRight',
      });
      setQty(remaining);
      return;
    }
    addToCart(product, qty);
    setModalOpen(false);
    notification.success({
      title: 'Đã thêm vào giỏ hàng',
      description: `${qty} × "${product.name}" đã được thêm vào giỏ hàng.`,
      placement: 'topRight',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 mb-4">{error || 'Không tìm thấy sản phẩm.'}</p>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/products')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const isActive = product.status === 'Active';
  const totalStock = Number(product.stock || 0);
  const remainingStock = Math.max(0, totalStock - cartQty);
  const maxQty = remainingStock > 0 ? remainingStock : 1;
  const isSoldOutByCart = isActive && remainingStock <= 0;
  const disableAddButton = !isActive || isSoldOutByCart;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/client/products')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#6160DC] mb-6 transition-colors"
      >
        <ArrowLeftOutlined />
        Quay lại danh sách sản phẩm
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left - Thumbnail */}
        <div className="rounded-2xl overflow-hidden min-h-[280px]">
          <ProductImage
            src={product.img}
            alt={product.name}
            className="w-full h-72 rounded-2xl"
            iconSize="text-6xl"
          />
        </div>

        {/* Right - Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <Tag color="purple" className="!text-xs !font-semibold">{product.category}</Tag>
            <Tag color={isActive ? 'success' : 'error'} className="!text-xs !font-semibold ml-1">
              {isActive ? 'Còn hàng' : 'Hết hàng'}
            </Tag>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-xs text-gray-400 font-mono mb-4">SKU: {product.sku}</p>

          <div className="text-3xl font-extrabold text-[#6160DC] mb-1">
            {product.price?.toLocaleString('vi-VN')}đ
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Còn <strong className="text-gray-700">{product.stock}</strong> sản phẩm trong kho
          </p>

          <div className="border-t border-gray-100 pt-4 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Danh mục</p>
                <p className="font-semibold text-gray-800">{product.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Trạng thái</p>
                <p className={`font-semibold ${isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isActive ? 'Còn hàng' : 'Hết hàng'}
                </p>
              </div>
              {product.created_at && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Ngày đăng</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(product.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Add to cart button */}
          <div className="flex gap-3">
            <button
              disabled={disableAddButton}
              onClick={openAddModal}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all ${
                !disableAddButton
                  ? 'bg-[#6160DC] text-white hover:bg-[#5756c5] active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCartOutlined />
              {!isActive ? 'Hết hàng' : isSoldOutByCart ? 'Số sản phẩm đã đầy' : 'Thêm vào giỏ hàng'}
            </button>

            {cartItem && (
              <button
                onClick={() => navigate('/client/cart')}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold border-2 border-[#6160DC] text-[#6160DC] hover:bg-[#6160DC]/5 transition-colors"
              >
                <CheckOutlined />
                {cartItem.quantity} trong giỏ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal chọn số lượng ── */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        centered
        width={420}
      >
        <div className="p-2">
          {/* Product info trong modal */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <ProductImage
                src={product.img}
                alt={product.name}
                className="w-full h-full"
                iconSize="text-xl"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{product.category}</p>
              <p className="text-sm font-bold text-gray-800 truncate">{product.name}</p>
              <p className="text-base font-extrabold text-[#6160DC] mt-0.5">
                {product.price?.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>

          {/* Số lượng */}
          <div className="mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Chọn số lượng
            </p>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
              >
                <MinusOutlined className="text-xs" />
              </button>

              <div className="text-center">
                <InputNumber
                  min={1}
                  max={maxQty}
                  value={qty}
                  onChange={(v) => {
                    const next = Number(v || 1);
                    setQty(Math.max(1, Math.min(maxQty, next)));
                  }}
                  controls={false}
                  className="!w-16 !text-center !text-xl !font-extrabold !border-0 !bg-transparent"
                />
                <p className="text-[11px] text-gray-900">có thể thêm {remainingStock} sp</p>
              </div>

              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
              >
                <PlusOutlined className="text-xs" />
              </button>
            </div>
          </div>

          {/* Tạm tính */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-5">
            <span className="text-sm text-gray-500">Tạm tính</span>
            <span className="text-lg font-extrabold text-gray-900">
              {(product.price * qty).toLocaleString('vi-VN')}đ
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              block
              onClick={() => setModalOpen(false)}
              className="!rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              block
              icon={<ShoppingCartOutlined />}
              onClick={handleConfirmAdd}
              className="!bg-[#6160DC] hover:!bg-[#5756c5] !rounded-xl !font-bold"
            >
              Thêm vào giỏ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
