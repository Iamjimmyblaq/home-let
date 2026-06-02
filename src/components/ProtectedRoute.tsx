import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';

export const ProtectedRoute = ({
  children,
  roles,
}: { children: React.ReactNode; roles?: AppRole[] }) => {
  const { user, role, loading } = useAuth();
  const loc = useLocation();

  // Wait while auth is loading OR while we have a user but role hasn't resolved yet.
  if (loading || (user && !role)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  if (roles && (!role || !roles.includes(role))) {
    const dest = role === 'admin' || role === 'moderator' ? '/admin' : role === 'agent' ? '/agent' : '/dashboard';
    return <Navigate to={dest} replace />;
  }
  return <>{children}</>;
};
