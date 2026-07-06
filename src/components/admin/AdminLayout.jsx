import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Layers,
  Package,
  Mail,
  MessageSquare,
  ShoppingBag,
  LogOut,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/posts', label: 'Posts', icon: FileText },
  { to: '/admin/categories', label: 'Post categories', icon: FolderOpen },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/product-categories', label: 'Product categories', icon: Layers },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
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
    <div className="h-screen bg-[#ebe6dc] flex overflow-hidden">
      <aside className="w-56 bg-wine text-cream flex flex-col shrink-0 h-full shadow-panel">
        <div className="p-6 border-b border-cream/10 shrink-0">
          <Link
            to="/"
            className="font-display text-xl font-light tracking-tight hover:text-cream/90 transition-colors focus-visible:outline-offset-2 focus-visible:outline-cream/40"
          >
            Lily CMS
          </Link>
          <p className="font-body text-[10px] uppercase tracking-widest text-cream/45 mt-2">
            Content admin
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-h-0" aria-label="CMS">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors focus-visible:outline-offset-2 focus-visible:outline-cream/40 ${
                  isActive
                    ? 'bg-cream/15 text-cream font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'text-cream/70 hover:text-cream hover:bg-cream/10'
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
          className="flex items-center gap-3 px-6 py-4 text-sm text-cream/55 hover:text-cream hover:bg-cream/5 border-t border-cream/10 shrink-0 transition-colors w-full text-left focus-visible:outline-offset-[-2px] focus-visible:outline-cream/40"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Log out
        </button>
      </aside>
      <main className="flex-1 min-w-0 h-full overflow-y-auto bg-cream/40">
        <Outlet />
      </main>
    </div>
  );
}
