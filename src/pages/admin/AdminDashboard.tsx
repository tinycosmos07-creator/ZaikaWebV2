import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { money } from '../../lib/settings';
import { AdminLayout } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { ShoppingCart, IndianRupee, Users, Package, TrendingUp, AlertCircle, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/dashboard.php')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout title="Dashboard"><Loader /></AdminLayout>;

  const stats = data?.stats || {};
  const cards = [
    { label: 'Total Orders', value: stats.total_orders || 0, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Revenue', value: money(stats.total_revenue || 0), icon: IndianRupee, color: 'bg-green-50 text-green-600' },
    { label: 'Customers', value: stats.total_customers || 0, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Products', value: stats.active_products || 0, icon: Package, color: 'bg-amber-50 text-amber-600' },
    { label: 'Today Orders', value: stats.today_orders || 0, icon: Clock, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Pending Orders', value: stats.pending_orders || 0, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  ];

  const chart = data?.revenue_chart || [];
  const maxRev = Math.max(...chart.map((c: any) => c.total || 0), 1);
  const topProducts = data?.top_products || [];
  const statusCounts = data?.order_status_counts || {};
  const alerts = data?.alerts || [];

  return (
    <AdminLayout title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>
              <Icon size={18} />
            </div>
            <p className="mt-2 text-xl font-black text-neutral-900">{value}</p>
            <p className="text-xs text-neutral-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-neutral-900"><TrendingUp size={18} className="text-brand-500" /> Revenue (Last 7 Days)</h3>
          {chart.length > 0 ? (
            <div className="flex h-48 items-end justify-between gap-2">
              {chart.map((c: any, i: number) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg bg-brand-500 transition-all hover:bg-brand-600" style={{ height: `${(c.total / maxRev) * 100}%`, minHeight: '4px' }} />
                  <span className="text-[10px] text-neutral-400">{c.d?.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : <p className="py-12 text-center text-sm text-neutral-400">No data yet</p>}
        </div>

        {/* Order status */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <h3 className="mb-4 font-bold text-neutral-900">Order Status</h3>
          {Object.keys(statusCounts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]: any) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-neutral-600">{status.replace(/_/g, ' ')}</span>
                  <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-sm font-bold text-neutral-700">{count}</span>
                </div>
              ))}
            </div>
          ) : <p className="py-8 text-center text-sm text-neutral-400">No orders yet</p>}
        </div>
      </div>

      {/* Top products + Alerts */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <h3 className="mb-4 font-bold text-neutral-900">Top Products</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-neutral-700">{p.name}</span>
                  <span className="text-sm font-bold text-neutral-900">{p.units_sold} sold</span>
                </div>
              ))}
            </div>
          ) : <p className="py-8 text-center text-sm text-neutral-400">No data yet</p>}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-neutral-900"><AlertCircle size={18} className="text-amber-500" /> Alerts</h3>
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((a: any, i: number) => (
                <div key={i} className={`rounded-xl p-3 text-sm ${a.level === 'error' ? 'bg-red-50 text-red-700' : a.level === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs opacity-80">{a.message}</p>
                </div>
              ))}
            </div>
          ) : <p className="py-8 text-center text-sm text-neutral-400">All good! No alerts.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
