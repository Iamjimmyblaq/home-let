import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Building2, Hotel, Wallet, MessageSquare, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { useApp } from '@/store/app';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { naira } from '@/lib/format';

export const Navbar = () => {
  const { user, logout, walletBalance } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashHref = user?.role === 'admin' ? '/admin' : user?.role === 'agent' ? '/agent' : '/dashboard';

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center text-primary-foreground">
            <Home className="h-4 w-4" />
          </div>
          <span>Home<span className="text-accent">-let</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/listings" className={linkCls}>Buy / Rent</NavLink>
          <NavLink to="/hotels" className={linkCls}>Hotels & Short-let</NavLink>
          <NavLink to="/agents" className={linkCls}>Agents</NavLink>
          <NavLink to="/contact" className={linkCls}>Contact</NavLink>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/wallet" className="flex items-center gap-2 px-3 h-9 rounded-lg bg-secondary text-sm font-medium">
                <Wallet className="h-4 w-4 text-primary" />
                {naira(walletBalance)}
              </Link>
              <Link to={dashHref}>
                <Button variant="outline" size="sm">
                  <UserIcon className="h-4 w-4" /> {user.name}
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => { logout(); navigate('/'); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/register"><Button size="sm" className="bg-primary">Get Started</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 flex flex-col gap-3">
            <NavLink to="/listings" className={linkCls} onClick={() => setOpen(false)}>Buy / Rent</NavLink>
            <NavLink to="/hotels" className={linkCls} onClick={() => setOpen(false)}>Hotels & Short-let</NavLink>
            <NavLink to="/agents" className={linkCls} onClick={() => setOpen(false)}>Agents</NavLink>
            <NavLink to="/contact" className={linkCls} onClick={() => setOpen(false)}>Contact</NavLink>
            {user ? (
              <>
                <Link to="/wallet" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Wallet · {naira(walletBalance)}</Button></Link>
                <Link to={dashHref} onClick={() => setOpen(false)}><Button className="w-full">Dashboard</Button></Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Sign in</Button></Link>
                <Link to="/register" onClick={() => setOpen(false)}><Button className="w-full">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer = () => (
  <footer className="border-t bg-secondary/40 mt-20">
    <div className="container py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 font-bold text-lg mb-3">
          <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center text-primary-foreground">
            <Home className="h-4 w-4" />
          </div>
          Home<span className="text-accent">-let</span>
        </div>
        <p className="text-sm text-muted-foreground">Nigeria's trusted peer-to-peer real estate platform. Verified agents, escrow-protected payments.</p>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Explore</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/listings">Buy</Link></li>
          <li><Link to="/listings">Rent</Link></li>
          <li><Link to="/hotels">Short-let</Link></li>
          <li><Link to="/agents">Agents</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Company</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/contact">Support</Link></li>
          <li><a>Terms</a></li>
          <li><a>Privacy</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Get the app</h4>
        <p className="text-sm text-muted-foreground mb-3">Browse, book and pay on the go.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">iOS</Button>
          <Button size="sm" variant="outline">Android</Button>
        </div>
      </div>
    </div>
    <div className="border-t py-4 text-center text-xs text-muted-foreground">© 2026 Home-let. All rights reserved.</div>
  </footer>
);

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
