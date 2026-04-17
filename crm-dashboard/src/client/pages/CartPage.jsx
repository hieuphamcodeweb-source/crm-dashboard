import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox } from 'antd';
import { DeleteOutlined, ShoppingOutlined, ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useCart } from '../context/CartContext';
import ProductImage from '../../components/shared/ProductImage';
import CheckoutModal from '../components/CheckoutModal';

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, removeManyFromCart, updateQuantity, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const hasInitializedSelectionRef = useRef(false);
  const unavailableItems = cartItems.filter(
    (item) => item.isPurchasable === false || item.status !== 'Active' || Number(item.stock || 0) <= 0
  );
  const availableItems = cartItems.filter(
    (item) => !(item.isPurchasable === false || item.status !== 'Active' || Number(item.stock || 0) <= 0)
  );
  const availableItemIds = useMemo(
    () => availableItems.map((item) => String(item.id)),
    [availableItems]
  );
  const hasUnavailableItems = unavailableItems.length > 0;

  useEffect(() => {
    const availableIdSet = new Set(availableItemIds);
    setSelectedItemIds((prev) => {
      const filtered = prev.filter((id) => availableIdSet.has(String(id)));
      let next = filtered;

      // Chi tu dong chon tat ca mot lan dau tien de user co the bo tick thu cong ve sau.
      if (!hasInitializedSelectionRef.current) {
        next = [...availableItemIds];
        hasInitializedSelectionRef.current = true;
      }

      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev;
      }
      return next;
    });
  }, [availableItemIds]);

  useEffect(() => {
    if (cartItems.length === 0) {
      hasInitializedSelectionRef.current = false;
      setSelectedItemIds([]);
    }
  }, [cartItems.length]);

  const selectedItems = useMemo(() => {
    const selectedSet = new Set(selectedItemIds.map((id) => String(id)));
    return cartItems.filter((item) => selectedSet.has(String(item.id)));
  }, [cartItems, selectedItemIds]);

  const selectedCount = selectedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const selectedTotal = selectedItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const hasSelectedItems = selectedItems.length > 0;
  const isAllAvailableSelected = availableItems.length > 0 && availableItems.every((item) => selectedItemIds.includes(String(item.id)));

  const toggleItemSelection = (itemId, checked) => {
    const id = String(itemId);
    setSelectedItemIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((selectedId) => selectedId !== id);
    });
  };

  const toggleSelectAllAvailable = (checked) => {
    if (!checked) {
      setSelectedItemIds([]);
      return;
    }
    setSelectedItemIds(availableItems.map((item) => String(item.id)));
  };

  const handleOrderSuccess = () => {
    removeManyFromCart(selectedItemIds);
    setSelectedItemIds([]);
    setCheckoutOpen(false);
  };

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
          <p className="text-sm text-gray-400 mt-0.5">{cartItems.length} sản phẩm trong giỏ</p>
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
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
            <Checkbox
              checked={isAllAvailableSelected}
              onChange={(e) => toggleSelectAllAvailable(e.target.checked)}
              disabled={availableItems.length === 0}
            >
              Chọn tất cả sản phẩm có thể mua
            </Checkbox>
            <span className="text-xs text-gray-500">
              Đã chọn {selectedItems.length}/{availableItems.length}
            </span>
          </div>

          {cartItems.map((item) => {
            const isUnavailable = item.isPurchasable === false || item.status !== 'Active' || Number(item.stock || 0) <= 0;
            const isSelected = selectedItemIds.includes(String(item.id));
            return (
            <div
              key={item.id}
              className={`relative rounded-2xl p-4 border flex items-center gap-4 transition-shadow ${
                isUnavailable
                  ? 'bg-gray-100/70 border-gray-200'
                  : 'bg-white border-gray-100 hover:shadow-sm'
              }`}
            >
              {isUnavailable && (
                <div className="absolute inset-0 rounded-2xl bg-gray-300/35 pointer-events-none" />
              )}
              <div className="relative z-10">
                <Checkbox
                  checked={isSelected}
                  disabled={isUnavailable}
                  onChange={(e) => toggleItemSelection(item.id, e.target.checked)}
                />
              </div>
              {/* Thumbnail */}
              <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden relative z-10">
                <ProductImage
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full"
                  iconSize="text-2xl"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 relative z-10">
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
                {isUnavailable && (
                  <p className="text-xs font-semibold text-red-500 mt-1">Hết hàng - tạm khóa mua</p>
                )}
              </div>

              {/* Quantity control */}
              <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                {Number(item.stock) > 0 && (
                  <span className="text-[11px] text-gray-400 mr-1">max {item.stock}</span>
                )}
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={isUnavailable}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold text-gray-800">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={isUnavailable || (Number(item.stock) > 0 && item.quantity >= Number(item.stock))}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <div className="w-28 text-right flex-shrink-0 relative z-10">
                <p className="text-sm font-extrabold text-gray-900">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </p>
                <p className="text-xs text-gray-400">×{item.quantity}</p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0 relative z-10"
              >
                <DeleteOutlined />
              </button>
            </div>
            );
          })}
        </div>

        {/* ── Tóm tắt đơn hàng ── */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <h3 className="text-base font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tạm tính ({selectedCount} sản phẩm đã chọn)</span>
                <span>{selectedTotal.toLocaleString('vi-VN')}đ</span>
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
                  {selectedTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              block
              className="!bg-[#6160DC] hover:!bg-[#5756c5] !rounded-xl !font-bold"
              onClick={() => setCheckoutOpen(true)}
              disabled={!hasSelectedItems}
            >
              {!hasSelectedItems ? 'Chọn sản phẩm để mua' : 'Đặt hàng ngay'}
            </Button>
            {hasUnavailableItems && (
              <p className="text-xs text-red-500 text-center mt-2">
                Sản phẩm hết hàng sẽ bị khóa. Bạn vẫn có thể chọn mua các sản phẩm còn hàng.
              </p>
            )}

            <p className="text-xs text-gray-400 text-center mt-3">
              Miễn phí vận chuyển cho đơn hàng trên 500.000đ
            </p>
          </div>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        checkoutItems={selectedItems}
        checkoutCount={selectedCount}
        checkoutTotal={selectedTotal}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
}
