import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePortalAuth } from '../auth';

export function PortalGuard({ adminOnly = false }: { adminOnly?: boolean }) {
  const { currentUser, isAdmin, isAuthLoading } = usePortalAuth();
  const location = useLocation();

  // Wait for the /api/auth/me check to resolve before deciding to redirect.
  // Without this guard, a valid session would flash to the login page on every
  // hard refresh while the JWT cookie is being verified.
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071525]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/portal/login" replace state={{ from: location }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <Outlet />;
}
