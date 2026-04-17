import { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Select, Tag, Tooltip } from 'antd';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons';

const ORDER_API_URL = 'http://localhost:3001/orders';
const POLLING_INTERVAL_MS = 5000;
const REFETCH_OPTIONS = { cache: 'no-store' };

const STATUS_COLORS = {
  Pending: 'gold',
  Processing: 'blue',
  Shipped: 'cyan',
  Delivered: 'green',
  Cancelled: 'red',
};

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Processing', value: 'Processing' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
];

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('vi-VN');
}

export default function OrderTable() {
  const { notification, modal } = App.useApp();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setFetchError('');
      const res = await fetch(ORDER_API_URL, REFETCH_OPTIONS);
      if (!res.ok) throw new Error('Không tải được danh sách đơn hàng.');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Không tải được danh sách đơn hàng.');
      if (!silent) {
        setOrders([]);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const pollingId = window.setInterval(() => {
      loadOrders({ silent: true });
    }, POLLING_INTERVAL_MS);
    const handleWindowFocus = () => {
      loadOrders({ silent: true });
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.clearInterval(pollingId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const term = search.toLowerCase();
        const matchSearch =
          String(order.code || '').toLowerCase().includes(term) ||
          String(order.accountName || '').toLowerCase().includes(term) ||
          String(order.accountEmail || '').toLowerCase().includes(term);
        const matchStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [orders, search, statusFilter]);

  const updateOrderStatus = async (order, nextStatus) => {
    try {
      const res = await fetch(`${ORDER_API_URL}/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...order,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng.');
      const updatedOrder = await res.json();
      setOrders((prev) =>
        prev.map((item) => (String(item.id) === String(updatedOrder.id) ? updatedOrder : item))
      );
      notification.success({
        title: 'Cập nhật trạng thái thành công',
        description: `Đơn ${updatedOrder.code || updatedOrder.id} đã chuyển sang ${nextStatus}.`,
        placement: 'topRight',
      });
    } catch (error) {
      notification.error({
        title: 'Cập nhật trạng thái thất bại',
        description: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.',
        placement: 'topRight',
      });
    }
  };

  const viewOrderDetail = (order) => {
    modal.info({
      title: `Chi tiết đơn ${order.code || order.id}`,
      width: 680,
      okText: 'Đóng',
      content: (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><strong>Tài khoản:</strong> {order.accountName || '-'}</div>
            <div><strong>Email:</strong> {order.accountEmail || '-'}</div>
            <div><strong>Tổng tiền:</strong> {(order.total || 0).toLocaleString('vi-VN')}đ</div>
            <div><strong>Trạng thái:</strong> {order.status}</div>
            <div><strong>Thanh toán:</strong> {order.paymentMethod?.label || '-'}</div>
            <div><strong>Vận chuyển:</strong> {order.shippingMethod?.label || '-'}</div>
          </div>
          <div>
            <p className="font-semibold mb-2">Sản phẩm:</p>
            <div className="max-h-48 overflow-auto border border-gray-100 rounded-lg p-2 space-y-2">
              {(order.items || []).map((item) => (
                <div key={item.id} className="text-sm flex justify-between">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Order Management</h2>
          <p className="text-xs font-semibold text-[#6160DC] mt-0.5">Manage all customer orders</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => loadOrders()}>
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by order code, name, email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6160DC]/30 w-72 bg-gray-50"
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="!w-44"
          options={[{ label: 'All status', value: 'all' }, ...STATUS_OPTIONS]}
        />
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-gray-500 py-4">Loading orders...</p>
        ) : fetchError ? (
          <p className="text-sm text-red-500 py-4">{fetchError}</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No orders found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Shipping', 'Status', 'Created At', 'Actions'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium text-gray-400 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 pr-4 text-sm font-semibold text-gray-800">{order.code || order.id}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">
                    <div>{order.accountName || '-'}</div>
                    <div className="text-xs text-gray-400">{order.accountEmail || '-'}</div>
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{order.itemCount || order.items?.length || 0}</td>
                  <td className="py-3.5 pr-4 text-sm font-semibold text-[#6160DC]">
                    {(order.total || 0).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{order.paymentMethod?.label || '-'}</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{order.shippingMethod?.label || '-'}</td>
                  <td className="py-3.5 pr-4">
                    <Tag color={STATUS_COLORS[order.status] || 'default'}>{order.status || 'Pending'}</Tag>
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(order.created_at)}</td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <Select
                        value={order.status || 'Pending'}
                        onChange={(value) => updateOrderStatus(order, value)}
                        className="!w-32"
                        size="small"
                        options={STATUS_OPTIONS}
                      />
                      <Tooltip title="View details">
                        <Button size="small" icon={<EyeOutlined />} onClick={() => viewOrderDetail(order)} />
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
