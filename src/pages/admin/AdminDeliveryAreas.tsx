import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money } from '../../lib/settings';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { DeliveryZone } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminDeliveryAreas() {
  const toast = useToast();
  const [items, setItems] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/delivery.php?resource=zones')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load delivery zones'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const startAdd = () => {
    setEditing(null);
    setForm({ name: '', pincode: '', delivery_charge: '', min_order_value: '', estimated_minutes: 30, is_active: 1 });
    setShowForm(true);
  };

  const startEdit = (z: DeliveryZone) => {
    setEditing(z);
    setForm({ ...z });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast('Name is required', 'error'); return; }
    if (!form.pincode?.trim()) { toast('Pincode is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/delivery.php', { ...form, resource: 'zones', id: editing.id });
        toast('Delivery zone updated', 'success');
      } else {
        await adminApi.post('/delivery.php', { ...form, resource: 'zones' });
        toast('Delivery zone created', 'success');
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
      await adminApi.delete('/delivery.php', { data: { resource: 'zones', id: deleteId } });
      toast('Delivery zone deleted', 'success');
      setItems(prev => prev.filter(z => z.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  return (
    <AdminLayout title="Delivery Areas">
      <PageHeader title="Delivery Areas" action={
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Zone
        </button>
      } />

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No delivery zones found" subtitle="Add your first delivery zone" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Name</th>
                <th className="p-3">Pincode</th>
                <th className="p-3">Delivery Charge</th>
                <th className="p-3">Min Order</th>
                <th className="p-3">Est. Time</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(z => (
                <tr key={z.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3 font-semibold text-neutral-900">{z.name}</td>
                  <td className="p-3 text-neutral-500">{z.pincode}</td>
                  <td className="p-3 font-medium text-neutral-700">{money(z.delivery_charge)}</td>
                  <td className="p-3 text-neutral-500">{money(z.min_order_value)}</td>
                  <td className="p-3 text-neutral-500">{z.estimated_minutes} min</td>
                  <td className="p-3"><Badge status={Number(z.is_active) ? 'active' : 'inactive'}>{Number(z.is_active) ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(z)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(z.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Delivery Zone' : 'Add Delivery Zone'}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Zone Name *</label>
            <input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Muzaffarnagar City" />
          </div>
          <div>
            <label className="label">Pincode *</label>
            <input required value={form.pincode || ''} onChange={e => setForm({ ...form, pincode: e.target.value })} className="input" placeholder="251002" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Delivery Charge *</label>
              <input type="number" step="0.01" required value={form.delivery_charge || ''} onChange={e => setForm({ ...form, delivery_charge: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Min Order Value</label>
              <input type="number" step="0.01" value={form.min_order_value || ''} onChange={e => setForm({ ...form, min_order_value: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Estimated Minutes</label>
              <input type="number" value={form.estimated_minutes || 30} onChange={e => setForm({ ...form, estimated_minutes: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.is_active ?? 1} onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })} className="input">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Zone?" message="This will permanently delete the delivery zone." />
    </AdminLayout>
  );
}
