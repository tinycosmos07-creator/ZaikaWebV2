import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money } from '../../lib/settings';
import { AdminLayout, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import { TrendingUp, ShoppingCart, Users, Package, DollarSign } from 'lucide-react';

const CHART_TYPES = [
  { key: 'revenue', label: 'Revenue', icon: DollarSign, color: 'bg-green-500' },
  { key: 'orders', label: 'Orders', icon: ShoppingCart, color: 'bg-blue-500' },
  { key: 'customers', label: 'Customers', icon: Users, color: 'bg-purple-500' },
  { key: 'products', label: 'Products', icon: Package, color: 'bg-amber-500' },
  { key: 'profit', label: 'Profit', icon: TrendingUp, color: 'bg-brand-500' },
];

export default function AdminAnalytics() {
  const toast = useToast();
  const [type, setType] = useState('revenue');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    adminApi.get(`/analytics.php?type=${type}&from=${from}&to=${to}`)
      .then(({ data: res }) => setData(res))
      .catch(() => toast(apiError(null, 'Failed to load analytics'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [type, from, to]); // eslint-disable-line

  const chartData: any[] = data?.chart || data?.data || data?.points || [];
  const summary: any = data?.summary || data?.totals || data?.cards || {};
  const maxVal = Math.max(...chartData.map((d: any) => Number(d.value || d.total || d.count || d.amount || 0)), 1);

  const activeType = CHART_TYPES.find(t => t.key === type) || CHART_TYPES[0];

  return (
    <AdminLayout title="Analytics">
      <PageHeader title="Analytics" />

      {/* Chart type selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CHART_TYPES.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setType(key)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${type === key ? 'bg-brand-500 text-white' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input w-40" />
        </div>
        <div>
          <label className="label">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input w-40" />
        </div>
      </div>

      {/* Summary cards */}
      {Object.keys(summary).length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(summary).map(([key, val]: any) => (
            <div key={key} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
              <p className="text-xs font-bold uppercase text-neutral-400">{key.replace(/_/g, ' ')}</p>
              <p className="mt-1 text-xl font-black text-neutral-900">
                {typeof val === 'number' && (key.includes('revenue') || key.includes('amount') || key.includes('profit') || key.includes('total') || key.includes('spent'))
                  ? money(val)
                  : val}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bar chart */}
      {loading ? <Loader /> : chartData.length === 0 ? (
        <EmptyState icon={<TrendingUp size={40} />} title="No data for this period" subtitle="Try a different date range or chart type" />
      ) : (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-neutral-900">
            <activeType.icon size={18} className="text-brand-500" />
            {activeType.label} Trend
          </h3>
          <div className="flex h-64 items-end justify-between gap-1 overflow-x-auto">
            {chartData.map((d: any, i: number) => {
              const val = Number(d.value || d.total || d.count || d.amount || 0);
              const label = d.label || d.date || d.d || d.day || '';
              return (
                <div key={i} className="flex min-w-[40px] flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-neutral-600">
                    {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                  </span>
                  <div
                    className={`w-full rounded-t-lg ${activeType.color} transition-all hover:opacity-80`}
                    style={{ height: `${(val / maxVal) * 200}px`, minHeight: '4px' }}
                    title={`${label}: ${val}`}
                  />
                  <span className="text-[10px] text-neutral-400">{String(label).slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
