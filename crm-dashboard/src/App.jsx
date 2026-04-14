import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StatsCard from './components/StatsCard';
import CustomerTable from './components/CustomerTable';
import ProductTable from './components/ProductTable';
import CategoryTable from './components/CategoryTable';
import ProductEditPage from './components/ProductEditPage';

const avatarUrls = [
  'https://i.pravatar.cc/28?img=1',
  'https://i.pravatar.cc/28?img=5',
  'https://i.pravatar.cc/28?img=9',
  'https://i.pravatar.cc/28?img=20',
  'https://i.pravatar.cc/28?img=32',
];

const statsData = [
  {
    label: 'Total Customers',
    value: '5,423',
    trend: 'up',
    trendLabel: '16%',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: 'Members',
    value: '1,893',
    trend: 'down',
    trendLabel: '1%',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: 'Active Now',
    value: '189',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    extra: (
      <div className="flex -space-x-2">
        {avatarUrls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            className="w-6 h-6 rounded-full border-2 border-white object-cover"
          />
        ))}
      </div>
    ),
  },
];

function DashboardLayout() {
  const location = useLocation();
  const path = location.pathname;
  let pageTitle = 'Dashboard';

  if (path.startsWith('/product/edit/')) {
    pageTitle = 'Edit Product';
  } else if (path.startsWith('/product')) {
    pageTitle = 'Product Management';
  } else if (path.startsWith('/customers')) {
    pageTitle = 'Customers Management';
  } else if (path.startsWith('/category')) {
    pageTitle = 'Category Management';
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6160DC]/30 w-64"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-5 mb-6">
          {statsData.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div>

        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/product" replace />} />
        <Route path="/product" element={<ProductTable />} />
        <Route path="/product/edit/:id" element={<ProductEditPage />} />
        <Route path="/customers" element={<CustomerTable />} />
        <Route path="/category" element={<CategoryTable />} />
      </Route>
      <Route path="*" element={<Navigate to="/product" replace />} />
    </Routes>
  );
}
