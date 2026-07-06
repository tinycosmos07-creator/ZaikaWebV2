import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ShoppingCart, Star, Users, Image, Truck, Ticket, Settings, Users as Users2, Boxes, Building2, BarChart3, TrendingUp, Zap, Clock, Gift, Calendar, LogOut, Menu, X, Bell } from 'lucide-react';
import { useAdminAuth } from '../../lib/adminAuth';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/delivery-areas', label: 'Delivery Areas', icon: Truck },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/employees', label: 'Employees', icon: Users2 },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/suppliers', label: 'Suppliers', icon: Building2 },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  { to: '/admin/flash-deals', label: 'Flash Deals', icon: Zap },
  { to: '/admin/happy-hour', label: 'Happy Hour', icon: Clock },
  { to: '/admin/spin-win', label: 'Spin & Win', icon: Gift },
  { to: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const { admin, logout } = useAdminAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-neutral-900 text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-sm font-black">Z</div>
          <div>
            <p className="text-sm font-bold">Zaika Admin</p>
            <p className="text-[10px] text-white/50">Management Panel</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === '/admin' ? loc.pathname === '/admin' : loc.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-brand-500 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-bold">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{admin?.name || 'Admin'}</p>
              <p className="truncate text-[10px] text-white/50">{admin?.role || 'staff'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-red-500/80 hover:text-white"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(v => !v)} className="grid h-9 w-9 place-items-center rounded-xl text-neutral-600 hover:bg-neutral-100 lg:hidden">
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <h1 className="text-lg font-bold text-neutral-900">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">
              View Store
            </Link>
            <button className="relative grid h-9 w-9 place-items-center rounded-xl text-neutral-600 hover:bg-neutral-100">
              <Bell size={18} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!open) return null;
  const maxW = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8">
      <div className={`w-full ${maxW} rounded-2xl bg-white shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-neutral-900">{title}</h3>
        <p className="mt-2 text-sm text-neutral-500">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Delete</button>
        </div>
      </div>
    </div>
  );
}

export function Badge({ status, children }: { status: string; children: ReactNode }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-neutral-100 text-neutral-500',
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    out_for_delivery: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || 'bg-neutral-100 text-neutral-600'}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
      {action}
    </div>
  );
}
