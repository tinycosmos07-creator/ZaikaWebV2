import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import ImageUpload from '../../components/ImageUpload';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { Banner } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminBanners() {
  const toast = useToast();
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/banners.php?show_all=1')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load banners'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const startAdd = () => {
    setEditing(null);
    setForm({ title: '', subtitle: '', image_url: '', link_url: '', cta_text: '', sort_order: 0, is_active: 1, starts_at: '', ends_at: '' });
    setShowForm(true);
  };

  const startEdit = (b: Banner) => {
    setEditing(b);
    setForm({ ...b });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast('Title is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/banners.php', { ...form, id: editing.id });
        toast('Banner updated', 'success');
      } else {
        await adminApi.post('/banners.php', form);
        toast('Banner created', 'success');
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
      await adminApi.delete('/banners.php', { data: { id: deleteId } });
      toast('Banner deleted', 'success');
      setItems(prev => prev.filter(b => b.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  return (
    <AdminLayout title="Banners">
      <PageHeader title="Banners" action={
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Banner
        </button>
      } />

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No banners found" subtitle="Add your first banner to get started" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Image</th>
                <th className="p-3">Title</th>
                <th className="p-3">Subtitle</th>
                <th className="p-3">Sort</th>
                <th className="p-3">Schedule</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(b => (
                <tr key={b.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3">
                    <img src={b.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=100'} alt="" className="h-10 w-16 rounded-lg object-cover" />
                  </td>
                  <td className="p-3 font-semibold text-neutral-900">{b.title}</td>
                  <td className="p-3 text-neutral-500 max-w-xs truncate">{b.subtitle || '—'}</td>
                  <td className="p-3 text-neutral-500">{b.sort_order}</td>
                  <td className="p-3 text-xs text-neutral-500">
                    {b.starts_at ? `From ${b.starts_at.slice(0, 10)}` : ''}
                    {b.ends_at ? ` to ${b.ends_at.slice(0, 10)}` : ''}
                    {!b.starts_at && !b.ends_at && 'Always'}
                  </td>
                  <td className="p-3"><Badge status={b.is_active ? 'active' : 'inactive'}>{b.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(b)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(b.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Banner' : 'Add Banner'} size="lg">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Title *</label>
              <input required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Subtitle</label>
              <input value={form.subtitle || ''} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="input" />
            </div>
          </div>
          <ImageUpload value={form.image_url || ''} onChange={url => setForm({ ...form, image_url: url })} label="Banner Image" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Link URL</label>
              <input value={form.link_url || ''} onChange={e => setForm({ ...form, link_url: e.target.value })} className="input" placeholder="/menu" />
            </div>
            <div>
              <label className="label">CTA Text</label>
              <input value={form.cta_text || ''} onChange={e => setForm({ ...form, cta_text: e.target.value })} className="input" placeholder="Order Now" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Sort Order</label>
              <input type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Starts At</label>
              <input type="datetime-local" value={form.starts_at || ''} onChange={e => setForm({ ...form, starts_at: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Ends At</label>
              <input type="datetime-local" value={form.ends_at || ''} onChange={e => setForm({ ...form, ends_at: e.target.value })} className="input" />
            </div>
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

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Banner?" message="This will permanently delete the banner." />
    </AdminLayout>
  );
}
