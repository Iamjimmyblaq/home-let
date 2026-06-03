import { ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export const RouteDebugPanel = () => {
  const { user, role, loading, routeDebug } = useAuth();
  if (!user && !routeDebug) return null;

  const allowedLabel = routeDebug?.allowed === null
    ? 'waiting'
    : routeDebug?.allowed
      ? 'allowed'
      : 'blocked';
  const required = routeDebug?.requiredRoles?.join(', ') || 'none';

  return (
    <aside className="fixed bottom-3 right-3 z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-lg border bg-card/95 p-4 text-xs text-card-foreground shadow-elegant backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-4 w-4 text-primary" /> Role / Route Debug
        </div>
        <Badge variant={routeDebug?.allowed ? 'default' : 'secondary'} className="capitalize">{allowedLabel}</Badge>
      </div>
      <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">Email</dt><dd className="truncate">{user?.email || routeDebug?.userEmail || 'none'}</dd>
        <dt className="text-muted-foreground">Resolved role</dt><dd className="font-medium">{role || routeDebug?.resolvedRole || 'none'}</dd>
        <dt className="text-muted-foreground">Auth loading</dt><dd>{loading || routeDebug?.loading ? 'yes' : 'no'}</dd>
        <dt className="text-muted-foreground">Path</dt><dd>{routeDebug?.path || window.location.pathname}</dd>
        <dt className="text-muted-foreground">Allowed roles</dt><dd>{required}</dd>
        <dt className="text-muted-foreground">Redirect</dt><dd>{routeDebug?.redirectTo || 'none'}</dd>
        <dt className="text-muted-foreground">Checked</dt><dd>{routeDebug?.checkedAt || 'not checked yet'}</dd>
      </dl>
      <div className="mt-3 rounded-md bg-muted p-2 text-muted-foreground">{routeDebug?.reason || 'No protected route has been checked yet.'}</div>
    </aside>
  );
};