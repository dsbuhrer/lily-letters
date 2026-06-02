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
    <div className="min-h-screen bg-[#f8f5ef] pt-24 pb-28 md:pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <header className="mb-8 md:mb-10">
          <p className="section-subtitle mb-2">My Account</p>
          <h1 className="page-title">Hello, {displayName}</h1>
        </header>

        <nav
          className="hidden md:flex gap-1 mb-8 border-b border-taupe/35 pb-px"
          aria-label="Account"
        >
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `account-tab ${isActive ? 'account-tab-active' : 'account-tab-inactive'}`
              }
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto account-tab account-tab-inactive"
          >
            <LogOut size={16} strokeWidth={1.5} />
            Sign out
          </button>
        </nav>

        <Outlet />
      </div>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur-md border-t border-taupe/35 z-40 shadow-[0_-4px_24px_rgba(44,34,51,0.06)]"
        aria-label="Account mobile"
      >
        <div className="flex items-center justify-around py-1.5 max-w-lg mx-auto">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-body tracking-wide min-w-[4rem] focus-visible:outline-offset-0 ${
                  isActive ? 'text-wine font-medium' : 'text-ink-subtle'
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
            className="flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-body text-ink-subtle min-w-[4rem]"
          >
            <LogOut size={20} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </nav>

      <p className="text-center mt-10 pb-2 md:pb-0">
        <Link to="/products" className="link-subtle">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
