import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';

export const ProtectedRoute = ({
  children,
  roles,
}: { children: React.ReactNode; roles?: AppRole[] }) => {
  const { user, role, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  if (roles && role && !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
