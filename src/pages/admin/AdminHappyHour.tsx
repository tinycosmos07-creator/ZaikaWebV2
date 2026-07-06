import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { HappyHour } from '../../types';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminHappyHour() {
  const toast = useToast();
  const [items, setItems] = useState<HappyHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HappyHour | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/happy-hour.php')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load happy hours'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const startAdd = () => {
    setEditing(null);
    setForm({ day_of_week: new Date().getDay(), start_time: '14:00', end_time: '17:00', discount_percent: '', discount_flat: '', is_active: 1 });
    setShowForm(true);
  };

  const startEdit = (h: HappyHour) => {
    setEditing(h);
    setForm({ ...h });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_time || !form.end_time) { toast('Start and end time are required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/happy-hour.php', { ...form, id: editing.id });
        toast('Happy hour updated', 'success');
      } else {
        await adminApi.post('/happy-hour.php', form);
        toast('Happy hour created', 'success');
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
      await adminApi.delete('/happy-hour.php', { data: { id: deleteId } });
      toast('Happy hour deleted', 'success');
      setItems(prev => prev.filter(h => h.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  const isActiveNow = (h: HappyHour) => {
    if (!h.is_active) return false;
    const now = new Date();
    if (now.getDay() !== Number(h.day_of_week)) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = String(h.start_time).split(':').map(Number);
    const [eh, em] = String(h.end_time).split(':').map(Number);
    return cur >= sh * 60 + sm && cur <= eh * 60 + em;
  };

  return (
    <AdminLayout title="Happy Hour">
      <PageHeader title="Happy Hours" action={
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Happy Hour
        </button>
      } />

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState icon={<Clock size={40} />} title="No happy hours found" subtitle="Create a happy hour to offer timed discounts" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Day</th>
                <th className="p-3">Time</th>
                <th className="p-3">Discount %</th>
                <th className="p-3">Discount Flat</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(h => {
                const active = isActiveNow(h);
                return (
                  <tr key={h.id} className={`border-b border-neutral-50 hover:bg-neutral-50 ${active ? 'bg-green-50/50' : ''}`}>
                    <td className="p-3 font-semibold text-neutral-900">{DAYS[Number(h.day_of_week)] || '—'}</td>
                    <td className="p-3 text-neutral-500">{h.start_time} — {h.end_time}</td>
                    <td className="p-3 text-neutral-700">{h.discount_percent ? `${h.discount_percent}%` : '—'}</td>
                    <td className="p-3 text-neutral-700">{h.discount_flat ? `₹${h.discount_flat}` : '—'}</td>
                    <td className="p-3">
                      {active ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700"><Clock size={11} /> Active Now</span> :
                       <Badge status={h.is_active ? 'active' : 'inactive'}>{h.is_active ? 'Active' : 'Inactive'}</Badge>}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => startEdit(h)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(h.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Happy Hour' : 'Add Happy Hour'}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Day of Week *</label>
            <select required value={form.day_of_week ?? 0} onChange={e => setForm({ ...form, day_of_week: parseInt(e.target.value) })} className="input">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Time *</label>
              <input type="time" required value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">End Time *</label>
              <input type="time" required value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Discount Percent</label>
              <input type="number" step="0.01" value={form.discount_percent || ''} onChange={e => setForm({ ...form, discount_percent: e.target.value })} className="input" placeholder="e.g. 20" />
            </div>
            <div>
              <label className="label">Discount Flat (₹)</label>
              <input type="number" step="0.01" value={form.discount_flat || ''} onChange={e => setForm({ ...form, discount_flat: e.target.value })} className="input" placeholder="e.g. 50" />
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

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Happy Hour?" message="This will permanently delete the happy hour." />
    </AdminLayout>
  );
}
