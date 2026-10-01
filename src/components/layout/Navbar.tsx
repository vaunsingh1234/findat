import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, ShieldCheck, User } from 'lucide-react';

interface NavbarProps {
  userRole?: 'investor' | 'admin' | null;
  isAuthenticated?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userRole = 'investor',
  isAuthenticated = false,
  userName = 'Investor',
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', authRequired: true },
    { label: 'Portfolio', path: '/portfolio', authRequired: true },
    { label: 'Stocks', path: '/stocks', authRequired: false },
    { label: 'Risk Engine', path: '/risk', authRequired: true },
    { label: 'Market', path: '/market', authRequired: false },
    { label: 'Recommendations', path: '/recommendations', authRequired: true },
    { label: 'Reports', path: '/reports', authRequired: true },
    ...(userRole === 'admin'
      ? [{ label: 'Admin', path: '/admin', authRequired: true, badge: 'Role' }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-warm bg-warm-cream/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark & Market Focus Pill */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center text-warm-cream font-display font-extrabold text-lg shadow-xs group-hover:bg-terracotta-hover transition-colors">
                F
              </span>
              <div className="flex flex-col">
                <span className="font-display font-black text-xl tracking-tight text-ink flex items-center gap-1">
                  Fin<span className="text-terracotta">Dat</span>
                </span>
              </div>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-olive-light text-olive border border-olive/20">
              NSE / BSE
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-150 relative ${
                    active
                      ? 'bg-ink text-warm-cream font-semibold'
                      : 'text-muted hover:text-ink hover:bg-surface-warm'
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-terracotta text-warm-cream uppercase font-mono font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Auth Actions & Profile Pill */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-3 py-1 rounded-full border border-border-warm bg-surface-warm text-xs font-medium text-ink hover:border-ink transition-colors ${
                    isActive('/profile') ? 'border-ink bg-white' : ''
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-terracotta" />
                  <span className="max-w-[100px] truncate">{userName}</span>
                  {userRole === 'admin' && (
                    <span title="Admin Account">
                      <ShieldCheck className="w-3.5 h-3.5 text-olive" />
                    </span>
                  )}
                </Link>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-3 py-1 text-xs text-muted hover:text-terracotta transition-colors font-medium cursor-pointer"
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-xs font-semibold tracking-wide text-ink hover:text-terracotta transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="button-editorial button-editorial-primary text-xs py-1.5 px-4 flex items-center gap-1"
                >
                  <span>Get Started</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-ink hover:bg-surface-warm border border-border-warm"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border-warm bg-warm-cream px-4 pt-3 pb-6 space-y-2">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-ink text-warm-cream font-semibold'
                    : 'text-muted hover:text-ink hover:bg-surface-warm'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 border-t border-border-warm flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-warm border border-border-warm text-sm font-medium text-ink"
                >
                  <span>Signed in as {userName}</span>
                  <span className="text-xs uppercase font-mono text-terracotta">{userRole}</span>
                </Link>
                {onLogout && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-terracotta font-medium"
                  >
                    Logout
                  </button>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium border border-border-warm rounded-lg text-ink bg-surface-warm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold rounded-lg bg-terracotta text-warm-cream"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
