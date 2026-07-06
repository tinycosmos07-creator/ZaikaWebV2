import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { CalendarEvent } from '../../types';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';

const EVENT_TYPES = ['holiday', 'event', 'promotion', 'maintenance', 'other'] as const;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TYPE_COLORS: Record<string, string> = {
  holiday: 'bg-red-100 text-red-700 border-red-200',
  event: 'bg-blue-100 text-blue-700 border-blue-200',
  promotion: 'bg-green-100 text-green-700 border-green-200',
  maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
  other: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

export default function AdminCalendar() {
  const toast = useToast();
  const [items, setItems] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [viewDate, setViewDate] = useState(() => new Date());

  const fetch = () => {
    setLoading(true);
    adminApi.get('/calendar.php')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load calendar events'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const startAdd = (dateStr?: string) => {
    setEditing(null);
    setForm({ title: '', description: '', event_date: dateStr || new Date().toISOString().slice(0, 10), event_type: 'event', is_active: 1 });
    setShowForm(true);
  };

  const startEdit = (e: CalendarEvent) => {
    setEditing(e);
    setForm({ ...e });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast('Title is required', 'error'); return; }
    if (!form.event_date) { toast('Event date is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/calendar.php', { ...form, id: editing.id });
        toast('Event updated', 'success');
      } else {
        await adminApi.post('/calendar.php', form);
        toast('Event created', 'success');
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
      await adminApi.delete('/calendar.php', { data: { id: deleteId } });
      toast('Event deleted', 'success');
      setItems(prev => prev.filter(e => e.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  // Calendar grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOnDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return items.filter(e => e.event_date?.slice(0, 10) === dateStr);
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <AdminLayout title="Calendar">
      <PageHeader title="Calendar Events" action={
        <button onClick={() => startAdd()} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Event
        </button>
      } />

      {loading ? <Loader /> : (
        <>
          {/* Calendar grid */}
          <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">{MONTHS[month]} {year}</h3>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100"><ChevronLeft size={18} /></button>
                <button onClick={() => setViewDate(new Date())} className="rounded-lg px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100">Today</button>
                <button onClick={nextMonth} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map(d => <div key={d} className="pb-2 text-center text-xs font-bold uppercase text-neutral-400">{d}</div>)}
              {cells.map((day, i) => (
                <div
                  key={i}
                  className={`min-h-[80px] rounded-lg border p-1.5 ${day ? 'border-neutral-100 hover:bg-neutral-50' : 'border-transparent'}`}
                >
                  {day && (
                    <>
                      <div className={`mb-1 text-xs font-bold ${isToday(day) ? 'grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white' : 'text-neutral-400'}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {eventsOnDay(day).map(e => (
                          <div
                            key={e.id}
                            onClick={() => startEdit(e)}
                            className={`cursor-pointer truncate rounded px-1 py-0.5 text-[10px] font-semibold border ${TYPE_COLORS[e.event_type] || TYPE_COLORS.other}`}
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* List view */}
          {items.length === 0 ? (
            <EmptyState icon={<CalIcon size={40} />} title="No events found" subtitle="Add your first calendar event" />
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                    <th className="p-3">Title</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(e => (
                    <tr key={e.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-neutral-900">{e.title}</td>
                      <td className="p-3 text-neutral-500 max-w-xs truncate">{e.description || '—'}</td>
                      <td className="p-3 text-neutral-500">{e.event_date?.slice(0, 10)}</td>
                      <td className="p-3"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[e.event_type] || TYPE_COLORS.other}`}>{e.event_type}</span></td>
                      <td className="p-3"><Badge status={e.is_active ? 'active' : 'inactive'}>{e.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => startEdit(e)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Pencil size={15} /></button>
                          <button onClick={() => setDeleteId(e.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Event' : 'Add Event'}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Title *</label>
            <input required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Event Date *</label>
              <input type="date" required value={form.event_date || ''} onChange={e => setForm({ ...form, event_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Event Type *</label>
              <select required value={form.event_type || 'event'} onChange={e => setForm({ ...form, event_type: e.target.value })} className="input">
                {EVENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
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

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Event?" message="This will permanently delete the calendar event." />
    </AdminLayout>
  );
}
