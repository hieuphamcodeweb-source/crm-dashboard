import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  {
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Product',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    hasArrow: true,
  },
  {
    label: 'Customers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    hasArrow: true,
  },
  {
    label: 'Category',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
        <circle cx="7" cy="7" r="1" />
        <circle cx="7" cy="12" r="1" />
        <circle cx="7" cy="17" r="1" />
      </svg>
    ),
    hasArrow: true,
  },
  {
    label: 'Income',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    hasArrow: true,
  },
  {
    label: 'Promote',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    hasArrow: true,
  },
  {
    label: 'Help',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth={2.5} />
      </svg>
    ),
    hasArrow: true,
  },
];

const switchableRoutes = {
  Product: '/product',
  Customers: '/customers',
  Category: '/category',
};

function isItemActive(itemLabel, pathname) {
  if (itemLabel === 'Product') {
    return pathname === '/product' || pathname.startsWith('/product/edit/');
  }
  return switchableRoutes[itemLabel] === pathname;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`relative min-h-screen bg-white flex flex-col border-r border-gray-100 shadow-sm transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-[220px]'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-7 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-6 overflow-hidden ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg border-2 border-gray-800 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="font-bold text-gray-900 text-base leading-none whitespace-nowrap">Dashboard</span>
            <span className="text-[10px] text-gray-400 block">v.01</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 mt-2">
        {navItems.map((item) => {
          const targetPath = switchableRoutes[item.label];
          const isSwitchable = Boolean(targetPath);
          const isActive = isSwitchable && isItemActive(item.label, location.pathname);

          return (
            <button
              key={item.label}
              type="button"
              title={collapsed ? item.label : undefined}
              onClick={() => isSwitchable && navigate(targetPath)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors group ${
                isActive
                  ? 'bg-[#6160DC] text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                <span className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}>
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </div>
              {!collapsed && item.hasArrow && (
                <svg
                  viewBox="0 0 24 24"
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>
          );
        })}
      </nav>

      {/* Upgrade Card — ẩn khi thu gọn */}
      {!collapsed && (
        <div className="mx-3 mb-5 rounded-2xl bg-gradient-to-br from-[#6160DC] to-[#a855f7] p-4 text-white text-center">
          <p className="text-xs font-medium leading-snug mb-3">
            Upgrade to <strong>PRO</strong> to get<br />access all Features!
          </p>
          <button className="w-full bg-white text-[#6160DC] text-xs font-semibold py-2 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
            Get Pro Now!
          </button>
        </div>
      )}

      {/* User */}
      <div className={`flex items-center border-t border-gray-100 px-3 py-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <img
          src="https://i.pravatar.cc/36?img=12"
          alt="Evano"
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">Evano</p>
              <p className="text-xs text-gray-400 truncate">Project Manager</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </div>
    </aside>
  );
}
