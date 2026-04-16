import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, FireOutlined, SafetyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ProductImage from '../../components/shared/ProductImage';

const ORDER_API_URL = 'http://localhost:3001/orders';
const PRODUCT_API_URL = 'http://localhost:3001/products';

const highlights = [
  {
    icon: <ThunderboltOutlined className="text-2xl text-[#6160DC]" />,
    title: 'Giao nhanh toàn quốc',
    desc: 'Xử lý đơn trong ngày, theo dõi trạng thái đơn hàng theo thời gian thực.',
  },
  {
    icon: <SafetyOutlined className="text-2xl text-emerald-500" />,
    title: 'Cam kết chính hãng',
    desc: '100% sản phẩm có nguồn gốc rõ ràng, chính sách bảo hành minh bạch.',
  },
  {
    icon: <FireOutlined className="text-2xl text-amber-500" />,
    title: 'Deals mỗi ngày',
    desc: 'Ưu đãi và mã giảm giá được cập nhật liên tục theo từng khung giờ.',
  },
];

function formatCurrency(value) {
  return `${(value || 0).toLocaleString('vi-VN')}đ`;
}

export default function ClientHomePage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoadingTop, setIsLoadingTop] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoadingTop(true);
        const [orderRes, productRes] = await Promise.all([
          fetch(ORDER_API_URL),
          fetch(PRODUCT_API_URL),
        ]);
        if (!orderRes.ok) throw new Error('Cannot load orders');
        const [orderData, productData] = await Promise.all([
          orderRes.json(),
          productRes.ok ? productRes.json() : Promise.resolve([]),
        ]);
        if (isMounted) {
          setOrders(Array.isArray(orderData) ? orderData : []);
          setProducts(Array.isArray(productData) ? productData : []);
        }
      } catch {
        if (isMounted) {
          setOrders([]);
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingTop(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const topSellingProducts = useMemo(() => {
    const productById = new Map(
      products.map((product) => [String(product.id), product])
    );

    const soldMap = new Map();
    orders
      .filter((order) => order.status !== 'Cancelled')
      .forEach((order) => {
        (order.items || []).forEach((item) => {
          const key = String(item.id);
          const existing = soldMap.get(key);
          const quantity = Number(item.quantity || 0);
          const revenue = Number(item.price || 0) * quantity;
          if (existing) {
            soldMap.set(key, {
              ...existing,
              soldQty: existing.soldQty + quantity,
              revenue: existing.revenue + revenue,
            });
          } else {
            soldMap.set(key, {
              id: item.id,
              // lưu dữ liệu order làm fallback nếu sản phẩm không còn trong bảng products
              fallbackName: item.name,
              fallbackCategory: item.category,
              fallbackPrice: item.price,
              soldQty: quantity,
              revenue,
            });
          }
        });
      });

    return [...soldMap.values()]
      .map((sold) => {
        const matchedProduct = productById.get(String(sold.id));
        return {
          id: sold.id,
          name: matchedProduct?.name || sold.fallbackName || 'Unknown product',
          category: matchedProduct?.category || sold.fallbackCategory || '-',
          price: Number(matchedProduct?.price ?? sold.fallbackPrice ?? 0),
          // Quan trọng: luôn ưu tiên ảnh theo ID từ bảng products
          img: matchedProduct?.img || '',
          soldQty: sold.soldQty,
          revenue: sold.revenue,
        };
      })
      .sort((a, b) => b.soldQty - a.soldQty || b.revenue - a.revenue)
      .slice(0, 3);
  }, [orders, products]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#6160DC] to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest bg-white/20 px-4 py-1.5 rounded-full mb-5 inline-block">
              Nền tảng mua sắm thế hệ mới
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Chọn đúng sản phẩm, <br />
              <span className="text-yellow-300">mua nhanh trong 1 chạm</span>
            </h1>
            <p className="text-white/85 text-sm sm:text-base max-w-xl mb-8">
              Từ thiết bị công nghệ đến phụ kiện hằng ngày, mọi thứ đều được tối ưu để bạn
              mua nhanh, giao nhanh và an tâm sử dụng.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/client/products')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#6160DC] font-bold rounded-xl hover:bg-yellow-50 transition-colors shadow-lg"
              >
                Khám phá sản phẩm <ArrowRightOutlined />
              </button>
              <button
                onClick={() => navigate('/client/cart')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30"
              >
                Xem giỏ hàng
              </button>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-white/70 mb-3">Chỉ số nổi bật</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-2xl font-extrabold">10K+</p>
                <p className="text-[11px] text-white/75">Đơn hàng</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-2xl font-extrabold">4.9/5</p>
                <p className="text-[11px] text-white/75">Đánh giá</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-2xl font-extrabold">24/7</p>
                <p className="text-[11px] text-white/75">Hỗ trợ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top selling */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top 3 sản phẩm bán chạy</h2>
            <p className="text-sm text-gray-500">Tính theo dữ liệu thực tế từ đơn hàng đã tạo</p>
          </div>
          <button
            onClick={() => navigate('/client/products')}
            className="text-sm font-semibold text-[#6160DC] hover:underline"
          >
            Xem tất cả
          </button>
        </div>

        {isLoadingTop ? (
          <p className="text-sm text-gray-500">Đang tải dữ liệu bán chạy...</p>
        ) : topSellingProducts.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có dữ liệu đơn hàng để thống kê.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topSellingProducts.map((product, idx) => (
              <button
                key={product.id}
                onClick={() => navigate(`/client/products/${product.id}`)}
                className="text-left bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="relative h-44">
                  <ProductImage src={product.img} alt={product.name} className="w-full h-full" iconSize="text-4xl" />
                  <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-black/70 text-white">
                    TOP #{idx + 1}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                  <p className="text-sm font-bold text-gray-800 mb-2 line-clamp-2">{product.name}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Đã bán: <strong>{product.soldQty}</strong></span>
                    <span className="font-semibold text-[#6160DC]">{formatCurrency(product.price)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Vì sao khách hàng quay lại?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
