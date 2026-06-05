import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePortalAuth } from '../auth';

export function PortalGuard({ adminOnly = false }: { adminOnly?: boolean }) {
  const { currentUser, isAdmin } = usePortalAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/portal/login" replace state={{ from: location }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <Outlet />;
}
