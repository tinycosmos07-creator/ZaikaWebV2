import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money } from '../../lib/settings';
import { AdminLayout, Modal, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { Customer } from '../../types';
import { Search, Eye, Power } from 'lucide-react';

export default function AdminCustomers() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Customer | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetch = () => {
    setLoading(true);
    adminApi.get('/customers.php?per_page=100')
      .then(({ data }) => setCustomers(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load customers'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const toggleActive = async (c: Customer) => {
    setToggling(c.id);
    try {
      await adminApi.put('/customers.php', { id: c.id, is_active: c.is_active ? 0 : 1 });
      toast(`Customer ${c.is_active ? 'deactivated' : 'activated'}`, 'success');
      setCustomers(prev => prev.map(cu => cu.id === c.id ? { ...cu, is_active: c.is_active ? 0 : 1 } : cu));
      if (detail?.id === c.id) setDetail({ ...detail, is_active: c.is_active ? 0 : 1 });
    } catch (err) {
      toast(apiError(err, 'Update failed'), 'error');
    } finally {
      setToggling(null);
    }
  };

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Customers">
      <PageHeader title="Customers" />

      <div className="mb-4 relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or phone..." className="input pl-10" />
      </div>

      {loading ? <Loader /> : filtered.length === 0 ? (
        <EmptyState icon={<Search size={40} />} title="No customers found" subtitle="Customers will appear here after registration" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Total Spent</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3 font-semibold text-neutral-900">{c.name}</td>
                  <td className="p-3 text-neutral-500">{c.email || '—'}</td>
                  <td className="p-3 text-neutral-500">{c.phone || '—'}</td>
                  <td className="p-3 text-neutral-700 font-medium">{c.orders_count || 0}</td>
                  <td className="p-3 font-bold text-neutral-900">{money(c.total_spent || 0)}</td>
                  <td className="p-3"><Badge status={c.is_active ? 'active' : 'inactive'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDetail(c)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Eye size={15} /></button>
                      <button
                        onClick={() => toggleActive(c)}
                        disabled={toggling === c.id}
                        className={`grid h-8 w-8 place-items-center rounded-lg ${c.is_active ? 'text-green-500 hover:bg-green-50' : 'text-neutral-400 hover:bg-neutral-100'} disabled:opacity-50`}
                        title={c.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Customer Details">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-xl font-bold text-brand-600">
                {detail.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900">{detail.name}</p>
                <Badge status={detail.is_active ? 'active' : 'inactive'}>{detail.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-bold uppercase text-neutral-400">Email</p>
                <p className="mt-1 font-medium text-neutral-700">{detail.email || '—'}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-bold uppercase text-neutral-400">Phone</p>
                <p className="mt-1 font-medium text-neutral-700">{detail.phone || '—'}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-bold uppercase text-neutral-400">Total Orders</p>
                <p className="mt-1 font-medium text-neutral-700">{detail.orders_count || 0}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-bold uppercase text-neutral-400">Total Spent</p>
                <p className="mt-1 font-medium text-neutral-700">{money(detail.total_spent || 0)}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-bold uppercase text-neutral-400">Joined</p>
                <p className="mt-1 font-medium text-neutral-700">{detail.created_at?.slice(0, 10) || '—'}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-bold uppercase text-neutral-400">Last Login</p>
                <p className="mt-1 font-medium text-neutral-700">{detail.last_login_at?.slice(0, 16) || '—'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => toggleActive(detail)}
                disabled={toggling === detail.id}
                className={`rounded-xl px-5 py-2 text-sm font-bold text-white disabled:opacity-50 ${detail.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {toggling === detail.id ? 'Updating...' : detail.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => setDetail(null)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
