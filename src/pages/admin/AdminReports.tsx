import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money } from '../../lib/settings';
import { AdminLayout, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import { Download, Calendar } from 'lucide-react';

const REPORT_TYPES = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'orders', label: 'Orders' },
  { key: 'profit', label: 'Profit' },
  { key: 'products', label: 'Products' },
];

export default function AdminReports() {
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
    adminApi.get(`/reports.php?type=${type}&from=${from}&to=${to}`)
      .then(({ data: res }) => setData(res))
      .catch(() => toast(apiError(null, 'Failed to load report'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [type, from, to]); // eslint-disable-line

  const rows: any[] = data?.data || data?.rows || data?.items || [];
  const summary: any = data?.summary || data?.totals || {};
  const columns: string[] = rows.length > 0 ? Object.keys(rows[0]) : [];

  const exportCSV = () => {
    if (rows.length === 0) { toast('No data to export', 'error'); return; }
    const header = columns.join(',');
    const body = rows.map((r: any) => columns.map(c => {
      const v = r[c];
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(',') || s.includes('\n') ? `"${s}"` : s;
    }).join(',')).join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${type}_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported', 'success');
  };

  return (
    <AdminLayout title="Reports">
      <PageHeader title="Reports" action={
        <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Download size={16} /> Export CSV
        </button>
      } />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Report Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="input w-40">
            {REPORT_TYPES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
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
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(summary).map(([key, val]: any) => (
            <div key={key} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
              <p className="text-xs font-bold uppercase text-neutral-400">{key.replace(/_/g, ' ')}</p>
              <p className="mt-1 text-lg font-black text-neutral-900">
                {typeof val === 'number' && (key.includes('revenue') || key.includes('amount') || key.includes('profit') || key.includes('total'))
                  ? money(val)
                  : val}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading ? <Loader /> : rows.length === 0 ? (
        <EmptyState icon={<Calendar size={40} />} title="No data for this period" subtitle="Try a different date range or report type" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                {columns.map(col => <th key={col} className="p-3">{col.replace(/_/g, ' ')}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50">
                  {columns.map(col => {
                    const v = r[col];
                    const isMoney = typeof v === 'number' && (col.includes('revenue') || col.includes('amount') || col.includes('price') || col.includes('profit') || col.includes('total') || col.includes('cost'));
                    return (
                      <td key={col} className="p-3 font-medium text-neutral-700">
                        {isMoney ? money(v) : v !== null && v !== undefined ? String(v) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
