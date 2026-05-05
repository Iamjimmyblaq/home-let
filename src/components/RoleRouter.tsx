import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** When the user's role changes, send them to their proper dashboard. */
export const RoleRouter = () => {
  const { role, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const prev = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!user) { prev.current = null; return; }
    if (prev.current === undefined) { prev.current = role; return; } // initial
    if (prev.current !== role) {
      prev.current = role;
      // Only redirect if currently on a dashboard route
      if (/^\/(dashboard|agent|admin)/.test(loc.pathname)) {
        const dest = role === 'admin' || role === 'moderator' ? '/admin'
          : role === 'agent' ? '/agent' : '/dashboard';
        nav(dest, { replace: true });
      }
    }
  }, [role, user, loc.pathname, nav]);

  return null;
};
