import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import ImageUpload from '../../components/ImageUpload';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { Category } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminCategories() {
  const toast = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/categories.php?all=1')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load categories'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const startAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', image_url: '', sort_order: 0, is_active: 1 });
    setShowForm(true);
  };

  const startEdit = (c: Category) => {
    setEditing(c);
    setForm({ ...c });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/categories.php', { ...form, id: editing.id });
        toast('Category updated', 'success');
      } else {
        await adminApi.post('/categories.php', form);
        toast('Category created', 'success');
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
      await adminApi.delete('/categories.php', { data: { id: deleteId } });
      toast('Category deleted', 'success');
      setItems(prev => prev.filter(c => c.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  return (
    <AdminLayout title="Categories">
      <PageHeader title="Categories" action={
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Category
        </button>
      } />

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No categories found" subtitle="Add your first category to get started" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Image</th>
                <th className="p-3">Name</th>
                <th className="p-3">Description</th>
                <th className="p-3">Sort Order</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3">
                    <img src={c.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=100'} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  </td>
                  <td className="p-3 font-semibold text-neutral-900">{c.name}</td>
                  <td className="p-3 text-neutral-500 max-w-xs truncate">{c.description || '—'}</td>
                  <td className="p-3 text-neutral-500">{c.sort_order}</td>
                  <td className="p-3"><Badge status={c.is_active ? 'active' : 'inactive'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></td>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input" />
          </div>
          <ImageUpload value={form.image_url || ''} onChange={url => setForm({ ...form, image_url: url })} label="Category Image" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sort Order</label>
              <input type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: e.target.value })} className="input" />
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

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Category?" message="This will permanently delete the category." />
    </AdminLayout>
  );
}
