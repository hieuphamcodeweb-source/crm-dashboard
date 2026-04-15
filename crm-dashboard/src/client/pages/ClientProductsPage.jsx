import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Spin, Tag, Empty } from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined } from '@ant-design/icons';
import ProductImage from '../../components/shared/ProductImage';

const PRODUCT_API_URL = 'http://localhost:3001/products';
const CATEGORY_API_URL = 'http://localhost:3001/categories';

function ProductCard({ product, onView }) {
  const isActive = product.status === 'Active';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Thumbnail */}
      <div className="h-44 relative overflow-hidden rounded-t-2xl">
        <ProductImage
          src={product.img}
          alt={product.name}
          className="w-full h-full"
          iconSize="text-4xl"
        />
        <div className="absolute top-3 right-3">
          <Tag
            color={isActive ? 'success' : 'error'}
            className="!text-[11px] !font-semibold"
          >
            {isActive ? 'Còn hàng' : 'Hết hàng'}
          </Tag>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[11px] font-semibold text-[#6160DC] uppercase tracking-wide mb-1">
          {product.category}
        </span>
        <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-2 flex-1">{product.name}</h3>
        <p className="text-[11px] text-gray-400 mb-3 font-mono">SKU: {product.sku}</p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-gray-900">
            {product.price?.toLocaleString('vi-VN')}
            <span className="text-xs font-normal text-gray-500 ml-0.5">đ</span>
          </span>
          <span className="text-xs text-gray-400">{product.stock} còn lại</span>
        </div>

        <button
          onClick={() => onView(product)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold bg-[#6160DC] text-white hover:bg-[#5756c5] active:scale-[0.98] transition-all"
        >
          <EyeOutlined />
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

export default function ClientProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        setError('');
        const [prodRes, catRes] = await Promise.all([
          fetch(PRODUCT_API_URL),
          fetch(CATEGORY_API_URL),
        ]);
        if (!prodRes.ok) throw new Error('Không tải được danh sách sản phẩm.');
        const [prodData, catData] = await Promise.all([
          prodRes.json(),
          catRes.ok ? catRes.json() : Promise.resolve([]),
        ]);
        if (isMounted) {
          setProducts(Array.isArray(prodData) ? prodData : []);
          setCategories(Array.isArray(catData) ? catData : []);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const categoryOptions = useMemo(() => {
    const seen = new Set();
    const opts = [{ label: 'Tất cả danh mục', value: 'all' }];
    categories.forEach((c) => {
      if (!seen.has(c.name)) { seen.add(c.name); opts.push({ label: c.name, value: c.name }); }
    });
    return opts;
  }, [categories]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  const activeProducts = filtered.filter((p) => p.status === 'Active');
  const inactiveProducts = filtered.filter((p) => p.status !== 'Active');
  const displayProducts = [...activeProducts, ...inactiveProducts];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Khám phá sản phẩm</h1>
        <p className="text-gray-500 text-sm">Tìm kiếm và khám phá các sản phẩm chất lượng cao của chúng tôi</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          size="large"
          placeholder="Tìm kiếm sản phẩm, SKU..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 !rounded-xl"
          allowClear
        />
        <Select
          size="large"
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={categoryOptions}
          className="w-full sm:w-56"
          suffixIcon={<FilterOutlined />}
        />
      </div>

      {/* Stats bar */}
      {!isLoading && !error && (
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
          <span>
            Hiển thị <strong className="text-gray-800">{displayProducts.length}</strong> / {products.length} sản phẩm
          </span>
          {search && (
            <span className="text-[#6160DC] font-medium">
              Kết quả cho "{search}"
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-xs text-gray-400">Đảm bảo json-server đang chạy tại port 3001</p>
        </div>
      ) : displayProducts.length === 0 ? (
        <Empty description="Không tìm thấy sản phẩm nào" className="py-20" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={(p) => navigate(`/client/products/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
