import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Package, Mail, MessageSquare, LogOut } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/posts', label: 'Posts', icon: FileText },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/contacts', label: 'Contacts', icon: MessageSquare },
  { to: '/admin/subscribers', label: 'Subscribers', icon: Mail },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout: adminLogout } = useAdminAuth();

  const logout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="h-screen bg-cream flex overflow-hidden">
      <aside className="w-56 bg-wine text-cream flex flex-col shrink-0 h-full sticky top-0">
        <div className="p-6 border-b border-cream/10 shrink-0">
          <Link to="/" className="font-display text-xl font-light">
            Lily CMS
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm rounded-sm transition-colors ${
                  isActive ? 'bg-cream/15 text-cream' : 'text-cream/70 hover:text-cream hover:bg-cream/10'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 px-7 py-4 text-sm text-cream/60 hover:text-cream border-t border-cream/10 shrink-0"
        >
          <LogOut size={18} />
          Log out
        </button>
      </aside>
      <main className="flex-1 min-w-0 h-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
