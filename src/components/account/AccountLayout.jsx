import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Package, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { to: '/account', label: 'Home', icon: Home, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/settings', label: 'Settings', icon: Settings },
];

export default function AccountLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName =
    profile?.first_name ||
    profile?.email?.split('@')[0] ||
    'there';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f8f5ef] pt-24 pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-8">
          <p className="section-subtitle mb-1">My Account</p>
          <h1 className="font-display text-3xl md:text-4xl font-light text-wine">
            Hello, {displayName}
          </h1>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-1 mb-8 border-b border-taupe/30 pb-px">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-body transition-colors border-b-2 -mb-px ${
                  isActive
                    ? 'border-wine text-wine'
                    : 'border-transparent text-[#2d2020]/50 hover:text-wine'
                }`
              }
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto flex items-center gap-2 px-4 py-3 text-sm font-body text-[#2d2020]/40 hover:text-wine transition-colors"
          >
            <LogOut size={16} strokeWidth={1.5} />
            Sign out
          </button>
        </nav>

        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur-md border-t border-taupe/30 z-40">
        <div className="flex items-center justify-around py-2">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 text-xs font-body ${
                  isActive ? 'text-wine' : 'text-[#2d2020]/50'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-body text-[#2d2020]/50"
          >
            <LogOut size={20} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </nav>

      <p className="text-center mt-8 pb-4 md:pb-0">
        <Link to="/products" className="font-body text-sm text-gold hover:text-wine transition-colors">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
