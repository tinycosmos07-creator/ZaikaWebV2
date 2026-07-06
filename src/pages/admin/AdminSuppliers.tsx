import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { Supplier } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminSuppliers() {
  const toast = useToast();
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/suppliers.php')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load suppliers'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const startAdd = () => {
    setEditing(null);
    setForm({ name: '', contact_person: '', phone: '', email: '', address: '', is_active: 1 });
    setShowForm(true);
  };

  const startEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ ...s });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/suppliers.php', { ...form, id: editing.id });
        toast('Supplier updated', 'success');
      } else {
        await adminApi.post('/suppliers.php', form);
        toast('Supplier added', 'success');
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
      await adminApi.delete('/suppliers.php', { data: { id: deleteId } });
      toast('Supplier deleted', 'success');
      setItems(prev => prev.filter(s => s.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  return (
    <AdminLayout title="Suppliers">
      <PageHeader title="Suppliers" action={
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Supplier
        </button>
      } />

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No suppliers found" subtitle="Add your first supplier" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Name</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">Address</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3 font-semibold text-neutral-900">{s.name}</td>
                  <td className="p-3 text-neutral-500">{s.contact_person || '—'}</td>
                  <td className="p-3 text-neutral-500">{s.phone || '—'}</td>
                  <td className="p-3 text-neutral-500">{s.email || '—'}</td>
                  <td className="p-3 text-neutral-500 max-w-xs truncate">{s.address || '—'}</td>
                  <td className="p-3"><Badge status={s.is_active ? 'active' : 'inactive'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(s)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(s.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Contact Person</label>
              <input value={form.contact_person || ''} onChange={e => setForm({ ...form, contact_person: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="input" />
          </div>
          <div>
            <label className="label">Status</label>
            <select value={form.is_active ?? 1} onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })} className="input">
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Supplier?" message="This will permanently delete the supplier." />
    </AdminLayout>
  );
}
