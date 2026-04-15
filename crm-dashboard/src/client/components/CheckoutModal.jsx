import { useState } from 'react';
import { App, Button, Modal, Radio, Select, Tag } from 'antd';
import {
  EnvironmentOutlined,
  CarOutlined,
  CreditCardOutlined,
  TagOutlined,
  CheckCircleFilled,
  GiftOutlined,
} from '@ant-design/icons';
import ProductImage from '../../components/shared/ProductImage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ORDER_API_URL = 'http://localhost:3001/orders';

// ── Dữ liệu giả định ──────────────────────────────────────────────────────

const ADDRESSES = [
  { id: 1, name: 'Nguyễn Văn An', phone: '0901 234 567', address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh' },
  { id: 2, name: 'Trần Thị Bình', phone: '0912 345 678', address: '456 Lê Lợi, Phường Bến Thành, Quận 3, TP. Hồ Chí Minh' },
  { id: 3, name: 'Lê Văn Cường', phone: '0923 456 789', address: '789 Trần Phú, Phường Mộ Lao, Hà Đông, Hà Nội' },
  { id: 4, name: 'Phạm Thị Dung', phone: '0934 567 890', address: '321 Phan Chu Trinh, Phường Thạch Thang, Hải Châu, Đà Nẵng' },
];

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Giao hàng tiêu chuẩn', desc: '3 – 5 ngày làm việc', fee: 0, icon: '📦' },
  { id: 'express', label: 'Giao hàng nhanh', desc: '1 – 2 ngày làm việc', fee: 30000, icon: '🚀' },
  { id: 'sameday', label: 'Hỏa tốc', desc: '2 – 4 giờ trong ngày', fee: 60000, icon: '⚡' },
];

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵' },
  { id: 'bank', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
  { id: 'momo', label: 'Ví MoMo', icon: '🟣' },
  { id: 'vnpay', label: 'VNPay', icon: '🔵' },
];

const DISCOUNT_CODES = [
  { value: 'none', label: 'Không sử dụng mã giảm giá', rate: 0 },
  { value: 'SALE10', label: 'SALE10 — Giảm 10%', rate: 0.1 },
  { value: 'SALE15', label: 'SALE15 — Giảm 15%', rate: 0.15 },
  { value: 'SALE20', label: 'SALE20 — Giảm 20%', rate: 0.2 },
  { value: 'VIPCODE', label: 'VIPCODE — Giảm 25%', rate: 0.25 },
];

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function CheckoutModal({ open, onClose }) {
  const { notification } = App.useApp();
  const { cartItems, cartTotal, cartCount, clearCart } = useCart();
  const { user } = useAuth();

  const [addressId, setAddressId] = useState(ADDRESSES[0].id);
  const [shippingId, setShippingId] = useState('standard');
  const [paymentId, setPaymentId] = useState('cod');
  const [discountCode, setDiscountCode] = useState('none');
  const [isPlacing, setIsPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const selectedShipping = SHIPPING_METHODS.find((s) => s.id === shippingId);
  const selectedDiscount = DISCOUNT_CODES.find((d) => d.value === discountCode);

  const discountAmount = Math.round(cartTotal * (selectedDiscount?.rate || 0));
  const shippingFee = selectedShipping?.fee || 0;
  const finalTotal = cartTotal - discountAmount + shippingFee;

  const handlePlaceOrder = async () => {
    try {
      setIsPlacing(true);

      const now = new Date().toISOString();
      const generatedOrderCode = `ORD-${Date.now().toString().slice(-6)}`;
      const selectedAddress = ADDRESSES.find((addr) => addr.id === addressId);
      const selectedPayment = PAYMENT_METHODS.find((p) => p.id === paymentId);

      const orderPayload = {
        code: generatedOrderCode,
        accountId: user?.id || null,
        accountName: user?.name || 'Guest',
        accountEmail: user?.email || '',
        customer: selectedAddress || null,
        items: cartItems,
        itemCount: cartCount,
        subtotal: cartTotal,
        discountCode,
        discountRate: selectedDiscount?.rate || 0,
        discountAmount,
        shippingMethod: selectedShipping || null,
        shippingFee,
        paymentMethod: selectedPayment || null,
        total: finalTotal,
        status: 'Pending',
        created_at: now,
        updated_at: now,
      };

      const response = await fetch(ORDER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        throw new Error('Không thể lưu đơn hàng vào hệ thống.');
      }

      const savedOrder = await response.json();
      setOrderId(savedOrder.code || generatedOrderCode || savedOrder.id);
      clearCart();
      setSuccess(true);
    } catch (error) {
      notification.error({
        title: 'Đặt hàng thất bại',
        description: error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi tạo đơn hàng.',
        placement: 'topRight',
      });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setOrderId('');
    setAddressId(ADDRESSES[0].id);
    setShippingId('standard');
    setPaymentId('cod');
    setDiscountCode('none');
    onClose();
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        centered
        width={480}
        closable={false}
      >
        <div className="py-6 flex flex-col items-center text-center px-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircleFilled className="text-4xl text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Đặt hàng thành công!</h2>
          <p className="text-sm text-gray-500 mb-1">
            Đơn hàng <span className="font-bold text-gray-800">#{orderId}</span> đã được ghi nhận.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút.
          </p>

          <div className="w-full bg-gray-50 rounded-xl p-4 text-sm text-left mb-6 space-y-2">
            <div className="flex justify-between text-gray-500">
              <span>Tổng thanh toán</span>
              <span className="font-extrabold text-[#6160DC]">{finalTotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Phương thức</span>
              <span className="font-semibold text-gray-700">
                {PAYMENT_METHODS.find((p) => p.id === paymentId)?.label}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Vận chuyển</span>
              <span className="font-semibold text-gray-700">{selectedShipping?.label}</span>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleClose}
            className="!bg-[#6160DC] hover:!bg-[#5756c5] !rounded-xl !font-bold"
          >
            Xong
          </Button>
        </div>
      </Modal>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-1">
          <div className="w-7 h-7 rounded-lg bg-[#6160DC] flex items-center justify-center">
            <CreditCardOutlined className="text-white text-sm" />
          </div>
          <span className="text-base font-extrabold text-gray-900">Xác nhận đặt hàng</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={620}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 } }}
    >
      <div className="space-y-5 py-2">

        {/* ── 1. Địa chỉ giao hàng ── */}
        <section>
          <SectionTitle icon={<EnvironmentOutlined className="text-[#6160DC]" />} title="Địa chỉ giao hàng" />
          <Radio.Group
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
            className="w-full flex flex-col gap-2"
          >
            {ADDRESSES.map((addr) => (
              <label
                key={addr.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
                  addressId === addr.id
                    ? 'border-[#6160DC] bg-[#6160DC]/5'
                    : 'border-gray-100 hover:border-gray-300 bg-white'
                }`}
              >
                <Radio value={addr.id} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{addr.name}</span>
                    <span className="text-xs text-gray-400">{addr.phone}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{addr.address}</p>
                </div>
              </label>
            ))}
          </Radio.Group>
        </section>

        {/* ── 2. Phương thức vận chuyển ── */}
        <section>
          <SectionTitle icon={<CarOutlined className="text-emerald-500" />} title="Phương thức vận chuyển" />
          <Radio.Group
            value={shippingId}
            onChange={(e) => setShippingId(e.target.value)}
            className="w-full flex flex-col gap-2"
          >
            {SHIPPING_METHODS.map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
                  shippingId === s.id
                    ? 'border-[#6160DC] bg-[#6160DC]/5'
                    : 'border-gray-100 hover:border-gray-300 bg-white'
                }`}
              >
                <Radio value={s.id} />
                <span className="text-lg leading-none">{s.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{s.label}</span>
                    <span className={`text-sm font-bold ${s.fee === 0 ? 'text-emerald-500' : 'text-gray-700'}`}>
                      {s.fee === 0 ? 'Miễn phí' : `+${s.fee.toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              </label>
            ))}
          </Radio.Group>
        </section>

        {/* ── 3. Phương thức thanh toán ── */}
        <section>
          <SectionTitle icon={<CreditCardOutlined className="text-blue-500" />} title="Phương thức thanh toán" />
          <Radio.Group
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            className="w-full grid grid-cols-2 gap-2"
          >
            {PAYMENT_METHODS.map((p) => (
              <label
                key={p.id}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  paymentId === p.id
                    ? 'border-[#6160DC] bg-[#6160DC]/5'
                    : 'border-gray-100 hover:border-gray-300 bg-white'
                }`}
              >
                <Radio value={p.id} />
                <span className="text-base leading-none">{p.icon}</span>
                <span className="text-xs font-semibold text-gray-700 leading-snug">{p.label}</span>
              </label>
            ))}
          </Radio.Group>
        </section>

        {/* ── 4. Mã giảm giá ── */}
        <section>
          <SectionTitle icon={<TagOutlined className="text-amber-500" />} title="Mã giảm giá" />
          <Select
            value={discountCode}
            onChange={setDiscountCode}
            options={DISCOUNT_CODES.map((d) => ({
              value: d.value,
              label: (
                <div className="flex items-center justify-between">
                  <span>{d.value === 'none' ? 'Không dùng mã' : d.value}</span>
                  {d.rate > 0 && (
                    <Tag color="orange" className="!text-[11px] !ml-2">−{d.rate * 100}%</Tag>
                  )}
                </div>
              ),
            }))}
            className="w-full"
            size="large"
          />
          {selectedDiscount?.rate > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <GiftOutlined />
              Tiết kiệm {discountAmount.toLocaleString('vi-VN')}đ với mã {discountCode}
            </div>
          )}
        </section>

        {/* ── 5. Tóm tắt đơn hàng ── */}
        <section>
          <SectionTitle icon="🛒" title={`Sản phẩm (${cartCount})`} />
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <ProductImage src={item.img} alt={item.name} className="w-full h-full" iconSize="text-base" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                  <p className="text-[11px] text-gray-400">×{item.quantity}</p>
                </div>
                <span className="text-xs font-bold text-gray-700 flex-shrink-0">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Tạm tính</span>
              <span>{cartTotal.toLocaleString('vi-VN')}đ</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Giảm giá ({discountCode})</span>
                <span>−{discountAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Phí vận chuyển</span>
              <span className={shippingFee === 0 ? 'text-emerald-500 font-semibold' : ''}>
                {shippingFee === 0 ? 'Miễn phí' : `+${shippingFee.toLocaleString('vi-VN')}đ`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-extrabold text-gray-900">Tổng thanh toán</span>
              <span className="text-xl font-extrabold text-[#6160DC]">
                {finalTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        </section>

        {/* ── Footer buttons ── */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button size="large" block onClick={handleClose} className="!rounded-xl">
            Hủy
          </Button>
          <Button
            type="primary"
            size="large"
            block
            loading={isPlacing}
            onClick={handlePlaceOrder}
            className="!bg-[#6160DC] hover:!bg-[#5756c5] !rounded-xl !font-bold"
          >
            {isPlacing ? 'Đang xử lý...' : `Đặt hàng — ${finalTotal.toLocaleString('vi-VN')}đ`}
          </Button>
        </div>

      </div>
    </Modal>
  );
}
