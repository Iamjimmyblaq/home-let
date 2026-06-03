import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';

export const ProtectedRoute = ({
  children,
  roles,
}: { children: React.ReactNode; roles?: AppRole[] }) => {
  const { user, role, loading, setRouteDebug } = useAuth();
  const loc = useLocation();
  const roleRedirect = role === 'admin' || role === 'moderator' ? '/admin' : role === 'agent' ? '/agent' : '/dashboard';
  const stillLoading = loading || (!!user && !role);
  const allowed = !stillLoading && !!user && (!roles || (!!role && roles.includes(role)));
  const reason = stillLoading
    ? 'Waiting for auth session and role lookup to finish.'
    : !user
      ? 'Blocked because no signed-in user was found.'
      : roles && (!role || !roles.includes(role))
        ? `Blocked because ${role ?? 'no role'} is not allowed for this route.`
        : 'Allowed because the resolved role matches this route.';
  const redirectTo = stillLoading || allowed ? null : !user ? `/login?redirect=${encodeURIComponent(loc.pathname)}` : roleRedirect;

  useEffect(() => {
    setRouteDebug({
      path: loc.pathname,
      requiredRoles: roles ?? null,
      resolvedRole: role,
      userEmail: user?.email ?? null,
      loading: stillLoading,
      allowed: stillLoading ? null : allowed,
      reason,
      redirectTo,
      checkedAt: new Date().toLocaleTimeString(),
    });
  }, [allowed, loc.pathname, reason, redirectTo, role, roles, setRouteDebug, stillLoading, user]);

  // Wait while auth is loading OR while we have a user but role hasn't resolved yet.
  if (stillLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to={roleRedirect} replace />;
  }
  return <>{children}</>;
};
