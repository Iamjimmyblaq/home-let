import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** When the user's role changes, send them to their proper dashboard. */
export const RoleRouter = () => {
  const { role, user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const prev = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;
    if (!user) { prev.current = null; return; }
    const dest = role === 'admin' || role === 'moderator' ? '/admin'
      : role === 'agent' ? '/agent' : '/dashboard';
    if (/^\/(dashboard|agent|admin)/.test(loc.pathname) && loc.pathname !== dest) {
      nav(dest, { replace: true });
    }
    prev.current = role;
  }, [role, user, loading, loc.pathname, nav]);

  return null;
};
