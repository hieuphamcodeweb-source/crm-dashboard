import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, ShoppingCartOutlined, TagsOutlined, CustomerServiceOutlined } from '@ant-design/icons';

const features = [
  {
    icon: <ShoppingCartOutlined className="text-2xl text-[#6160DC]" />,
    title: 'Sản phẩm đa dạng',
    desc: 'Hàng nghìn sản phẩm từ nhiều danh mục khác nhau với chất lượng đảm bảo.',
  },
  {
    icon: <TagsOutlined className="text-2xl text-emerald-500" />,
    title: 'Giá cả cạnh tranh',
    desc: 'Cam kết giá tốt nhất thị trường, thường xuyên có chương trình khuyến mãi hấp dẫn.',
  },
  {
    icon: <CustomerServiceOutlined className="text-2xl text-amber-500" />,
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ hỗ trợ khách hàng luôn sẵn sàng phục vụ bạn mọi lúc mọi nơi.',
  },
];

export default function ClientHomePage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#6160DC] to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center">
          <span className="text-xs font-semibold uppercase tracking-widest bg-white/20 px-4 py-1.5 rounded-full mb-6">
            Chào mừng đến với ShopClient
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4 max-w-2xl">
            Mua sắm thông minh, <br />
            <span className="text-yellow-300">tiết kiệm tối đa</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-xl mb-8">
            Khám phá hàng nghìn sản phẩm chất lượng cao với mức giá tốt nhất.
            Giao hàng nhanh chóng, đổi trả dễ dàng.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/client/products')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-[#6160DC] font-bold rounded-xl hover:bg-yellow-50 transition-colors shadow-lg"
            >
              Khám phá ngay <ArrowRightOutlined />
            </button>
            <button
              onClick={() => navigate('/client/products')}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30"
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Tại sao chọn chúng tôi?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Sẵn sàng mua sắm?</h2>
          <p className="text-gray-400 text-sm mb-6">Hàng nghìn sản phẩm đang chờ bạn khám phá.</p>
          <button
            onClick={() => navigate('/client/products')}
            className="px-8 py-3 bg-[#6160DC] text-white font-bold rounded-xl hover:bg-[#5756c5] transition-colors"
          >
            Mua sắm ngay
          </button>
        </div>
      </section>
    </div>
  );
}
