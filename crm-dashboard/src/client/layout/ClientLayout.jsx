import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCartOutlined, AppstoreOutlined, UserOutlined, SettingOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { App, Badge } from 'antd';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { label: 'Trang chủ', path: '/client' },
  { label: 'Sản phẩm', path: '/client/products' },
  { label: 'Giới thiệu', path: '/client/about' },
];

export default function ClientLayout() {
  const { notification } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => {
    if (path === '/client') return location.pathname === '/client';
    return location.pathname.startsWith(path);
  };

  const isCartActive = location.pathname === '/client/cart';

  const handleLogout = () => {
    logout();
    notification.success({
      title: 'Đăng xuất thành công',
      description: 'Hẹn gặp lại bạn!',
      placement: 'topRight',
    });
    navigate('/client');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/client')}
            className="flex items-center gap-2 font-bold text-lg text-gray-900 hover:text-[#6160DC] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#6160DC] flex items-center justify-center">
              <AppstoreOutlined className="text-white text-sm" />
            </div>
            <span>ShopClient</span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-[#6160DC]/10 text-[#6160DC]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart icon với badge */}
            <Badge count={cartCount} size="small" color="#6160DC" overflowCount={99}>
              <button
                onClick={() => navigate('/client/cart')}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  isCartActive
                    ? 'bg-[#6160DC]/10 text-[#6160DC]'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Giỏ hàng"
              >
                <ShoppingCartOutlined className="text-lg" />
              </button>
            </Badge>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600">
                  <UserOutlined className="mr-1" />
                  {user?.name || 'User'}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  title="Đăng xuất"
                >
                  <LogoutOutlined className="text-lg" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/client/login')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                <LoginOutlined />
                Đăng nhập
              </button>
            )}

            <button
              onClick={() => navigate('/admin')}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors"
              title="Vào trang quản trị"
            >
              <SettingOutlined />
              Admin
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path d="M6 18L18 6M6 6l12 12" />
                  : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-3 flex flex-col gap-1 bg-white">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-[#6160DC]/10 text-[#6160DC]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => { navigate('/client/cart'); setMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isCartActive ? 'bg-[#6160DC]/10 text-[#6160DC]' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCartOutlined />
              Giỏ hàng
              {cartCount > 0 && (
                <span className="ml-auto bg-[#6160DC] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              <SettingOutlined className="mr-2" />Trang quản trị
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <LogoutOutlined className="mr-2" />
                Đăng xuất ({user?.name || 'User'})
              </button>
            ) : (
              <button
                onClick={() => { navigate('/client/login'); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <LoginOutlined className="mr-2" />
                Đăng nhập
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2 font-semibold text-gray-600">
            <div className="w-6 h-6 rounded bg-[#6160DC] flex items-center justify-center">
              <AppstoreOutlined className="text-white text-[10px]" />
            </div>
            ShopClient
          </div>
          <span>© 2026 ShopClient. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
