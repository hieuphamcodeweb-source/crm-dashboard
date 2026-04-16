import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RequireAdminAuth() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/client/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/client" replace />;
  }

  return <Outlet />;
}
