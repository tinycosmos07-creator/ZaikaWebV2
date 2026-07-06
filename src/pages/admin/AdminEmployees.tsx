import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money } from '../../lib/settings';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { Employee } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ROLES = ['chef', 'delivery', 'manager', 'waiter', 'cashier', 'other'] as const;

export default function AdminEmployees() {
  const toast = useToast();
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/employees.php')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load employees'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const startAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', role: 'chef', salary: '', joining_date: new Date().toISOString().slice(0, 10), is_active: 1 });
    setShowForm(true);
  };

  const startEdit = (e: Employee) => {
    setEditing(e);
    setForm({ ...e });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/employees.php', { ...form, id: editing.id });
        toast('Employee updated', 'success');
      } else {
        await adminApi.post('/employees.php', form);
        toast('Employee added', 'success');
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
      await adminApi.delete('/employees.php', { data: { id: deleteId } });
      toast('Employee deleted', 'success');
      setItems(prev => prev.filter(e => e.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  return (
    <AdminLayout title="Employees">
      <PageHeader title="Employees" action={
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Employee
        </button>
      } />

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No employees found" subtitle="Add your first employee" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Role</th>
                <th className="p-3">Salary</th>
                <th className="p-3">Joining Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(e => (
                <tr key={e.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3 font-semibold text-neutral-900">{e.name}</td>
                  <td className="p-3 text-neutral-500">
                    <p>{e.email || '—'}</p>
                    <p className="text-xs">{e.phone || ''}</p>
                  </td>
                  <td className="p-3"><span className="rounded-lg bg-neutral-100 px-2 py-0.5 text-xs font-semibold capitalize text-neutral-600">{e.role}</span></td>
                  <td className="p-3 font-medium text-neutral-700">{e.salary ? money(e.salary) : '—'}</td>
                  <td className="p-3 text-neutral-500">{e.joining_date || '—'}</td>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role *</label>
              <select required value={form.role || 'chef'} onChange={e => setForm({ ...form, role: e.target.value })} className="input">
                {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Salary</label>
              <input type="number" step="0.01" value={form.salary || ''} onChange={e => setForm({ ...form, salary: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Joining Date</label>
              <input type="date" value={form.joining_date || ''} onChange={e => setForm({ ...form, joining_date: e.target.value })} className="input" />
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

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Employee?" message="This will permanently delete the employee record." />
    </AdminLayout>
  );
}
