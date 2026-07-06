import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money } from '../../lib/settings';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { Coupon } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminCoupons() {
  const toast = useToast();
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/delivery.php?resource=coupons')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load coupons'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const startAdd = () => {
    setEditing(null);
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_order_value: '', max_discount: '', usage_limit: 100, starts_at: '', expires_at: '', is_active: 1, is_public: 1 });
    setShowForm(true);
  };

  const startEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ ...c });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code?.trim()) { toast('Code is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/delivery.php', { ...form, resource: 'coupons', id: editing.id });
        toast('Coupon updated', 'success');
      } else {
        await adminApi.post('/delivery.php', { ...form, resource: 'coupons' });
        toast('Coupon created', 'success');
      }
      setShowForm(false);
      fetch();
    } catch (err) {
      toast(apiError(err, 'Save failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await adminApi.delete('/delivery.php', { data: { resource: 'coupons', id: deleteId } });
      toast('Coupon deleted', 'success');
      setItems(prev => prev.filter(c => c.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  return (
    <AdminLayout title="Coupons">
      <PageHeader title="Coupons" action={
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Coupon
        </button>
      } />

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No coupons found" subtitle="Add your first coupon" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Code</th>
                <th className="p-3">Description</th>
                <th className="p-3">Type</th>
                <th className="p-3">Value</th>
                <th className="p-3">Min Order</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3"><span className="rounded-lg bg-brand-50 px-2 py-0.5 font-mono text-xs font-bold text-brand-600">{c.code}</span></td>
                  <td className="p-3 text-neutral-500 max-w-xs truncate">{c.description || '—'}</td>
                  <td className="p-3 text-neutral-500 capitalize">{c.discount_type}</td>
                  <td className="p-3 font-semibold text-neutral-900">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : money(c.discount_value)}
                  </td>
                  <td className="p-3 text-neutral-500">{c.min_order_value ? money(c.min_order_value) : '—'}</td>
                  <td className="p-3 text-neutral-500">{c.used_count || 0}/{c.usage_limit || '∞'}</td>
                  <td className="p-3 text-neutral-500">{c.expires_at ? c.expires_at.slice(0, 10) : '—'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Badge status={c.is_active ? 'active' : 'inactive'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                      {c.is_public ? <span className="text-[10px] text-blue-600">Public</span> : <span className="text-[10px] text-neutral-400">Private</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(c)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Coupon' : 'Add Coupon'} size="lg">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Code *</label>
              <input required value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input font-mono uppercase" placeholder="SAVE20" />
            </div>
            <div>
              <label className="label">Description</label>
              <input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Discount Type *</label>
              <select required value={form.discount_type || 'percentage'} onChange={e => setForm({ ...form, discount_type: e.target.value })} className="input">
                <option value="percentage">Percentage</option>
                <option value="flat">Flat Amount</option>
              </select>
            </div>
            <div>
              <label className="label">Discount Value *</label>
              <input type="number" step="0.01" required value={form.discount_value || ''} onChange={e => setForm({ ...form, discount_value: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Min Order Value</label>
              <input type="number" step="0.01" value={form.min_order_value || ''} onChange={e => setForm({ ...form, min_order_value: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Max Discount</label>
              <input type="number" step="0.01" value={form.max_discount || ''} onChange={e => setForm({ ...form, max_discount: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Usage Limit</label>
              <input type="number" value={form.usage_limit || 100} onChange={e => setForm({ ...form, usage_limit: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Starts At</label>
              <input type="datetime-local" value={form.starts_at || ''} onChange={e => setForm({ ...form, starts_at: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Expires At</label>
            <input type="datetime-local" value={form.expires_at || ''} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="input" />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} className="accent-brand-500" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input type="checkbox" checked={!!form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked ? 1 : 0 })} className="accent-brand-500" />
              Public (visible to all customers)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Coupon?" message="This will permanently delete the coupon." />
    </AdminLayout>
  );
}
