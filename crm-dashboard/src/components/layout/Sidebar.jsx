import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  DollarOutlined,
  StarOutlined,
  QuestionCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';

const navItems = [
  { label: 'Dashboard', icon: <AppstoreOutlined /> },
  { label: 'Product', icon: <ShoppingOutlined />, hasArrow: true },
  { label: 'Customers', icon: <TeamOutlined />, hasArrow: true },
  { label: 'Category', icon: <UnorderedListOutlined />, hasArrow: true },
  { label: 'Income', icon: <DollarOutlined />, hasArrow: true },
  { label: 'Promote', icon: <StarOutlined />, hasArrow: true },
  { label: 'Help', icon: <QuestionCircleOutlined />, hasArrow: true },
];

const switchableRoutes = {
  Product: '/product',
  Customers: '/customers',
  Category: '/category',
};

function isItemActive(itemLabel, pathname) {
  if (itemLabel === 'Product') {
    return pathname === '/product' || pathname.startsWith('/product/edit/') || /^\/product\/\d+$/.test(pathname);
  }
  if (itemLabel === 'Category') {
    return pathname === '/category' || pathname.startsWith('/category/edit/');
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
        {collapsed
          ? <MenuUnfoldOutlined className="text-[11px] text-gray-500" />
          : <MenuFoldOutlined className="text-[11px] text-gray-500" />
        }
      </button>

      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-6 overflow-hidden ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg border-2 border-gray-800 flex items-center justify-center flex-shrink-0">
          <AppstoreOutlined className="text-sm text-gray-800" />
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
                <span className={`text-base ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </div>
              {!collapsed && item.hasArrow && (
                <RightOutlined className={`text-xs flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Upgrade Card */}
      {!collapsed && (
        <div className="mx-3 mb-5 rounded-2xl bg-gradient-to-br from-[#6160DC] to-[#a855f7] p-4 text-white text-center">
          <p className="text-xs font-medium leading-snug mb-3">
            Upgrade to <strong>PRO</strong> to get<br />access all Features!
          </p>
          <button className="w-full bg-black text-[#6160DC] text-xs font-semibold py-2 rounded-full hover:bg-gray-500 transition-colors shadow-sm">
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
            <DownOutlined className="text-xs text-gray-400 flex-shrink-0" />
          </>
        )}
      </div>
    </aside>
  );
}
