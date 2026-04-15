import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { DeleteOutlined, ShoppingOutlined, ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useCart } from '../context/CartContext';
import ProductImage from '../../components/shared/ProductImage';
import CheckoutModal from '../components/CheckoutModal';

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, cartCount, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[#6160DC]/10 flex items-center justify-center mb-4">
          <ShoppingCartOutlined className="text-3xl text-[#6160DC]" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
        <p className="text-sm text-gray-400 mb-6">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
        <Button
          type="primary"
          icon={<ShoppingOutlined />}
          size="large"
          onClick={() => navigate('/client/products')}
          className="!bg-[#6160DC] hover:!bg-[#5756c5] !rounded-xl"
        >
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Giỏ hàng</h1>
          <p className="text-sm text-gray-400 mt-0.5">{cartCount} sản phẩm</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/client/products')}
          >
            Tiếp tục mua sắm
          </Button>
          <Button danger onClick={clearCart}>
            Xóa tất cả
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Danh sách sản phẩm ── */}
        <div className="flex-1 flex flex-col gap-3">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                <ProductImage
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full"
                  iconSize="text-2xl"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => navigate(`/client/products/${item.id}`)}
                  className="text-sm font-bold text-gray-800 hover:text-[#6160DC] transition-colors truncate block text-left"
                >
                  {item.name}
                </button>
                <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                <p className="text-sm font-bold text-[#6160DC] mt-1">
                  {item.price?.toLocaleString('vi-VN')}đ
                </p>
              </div>

              {/* Quantity control */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold text-gray-800">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <div className="w-28 text-right flex-shrink-0">
                <p className="text-sm font-extrabold text-gray-900">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </p>
                <p className="text-xs text-gray-400">×{item.quantity}</p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <DeleteOutlined />
              </button>
            </div>
          ))}
        </div>

        {/* ── Tóm tắt đơn hàng ── */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <h3 className="text-base font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tạm tính ({cartCount} sản phẩm)</span>
                <span>{cartTotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Phí vận chuyển</span>
                <span className="text-emerald-500 font-semibold">Miễn phí</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Tổng cộng</span>
                <span className="text-xl font-extrabold text-[#6160DC]">
                  {cartTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              block
              className="!bg-[#6160DC] hover:!bg-[#5756c5] !rounded-xl !font-bold"
              onClick={() => setCheckoutOpen(true)}
            >
              Đặt hàng ngay
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Miễn phí vận chuyển cho đơn hàng trên 500.000đ
            </p>
          </div>
        </div>
      </div>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
