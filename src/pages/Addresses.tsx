import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import type { Address } from '../types';
import Loader from '../components/Loader';
import { EmptyState } from '../components/Loader';
import { MapPin, Plus, Pencil, Trash2, Check, X, Home, Briefcase, Map } from 'lucide-react';

export default function Addresses() {
  const { customer } = useAuth();
  const toast = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ label: 'Home', full_name: '', phone: '', address_line: '', landmark: '', city: 'Muzaffarnagar', state: 'Uttar Pradesh', pincode: '', is_default: 0 });

  useEffect(() => {
    api.get('/customers.php?addresses=1')
      .then(({ data }) => setAddresses(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ label: 'Home', full_name: '', phone: '', address_line: '', landmark: '', city: 'Muzaffarnagar', state: 'Uttar Pradesh', pincode: '', is_default: 0 });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (a: Address) => {
    setEditing(a);
    setForm({ label: a.label || 'Home', full_name: a.full_name, phone: a.phone, address_line: a.address_line, landmark: a.landmark || '', city: a.city, state: a.state || 'Uttar Pradesh', pincode: a.pincode, is_default: a.is_default });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.full_name || !form.phone || !form.address_line || !form.pincode) {
      toast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put('/customers.php', { ...form, id: editing.id, action: 'address' });
        if (data?.success) {
          toast('Address updated', 'success');
          setAddresses(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a));
          resetForm();
        }
      } else {
        const { data } = await api.post('/customers.php', { ...form, action: 'address' });
        if (data?.success) {
          toast('Address added', 'success');
          setAddresses(prev => [...prev, { ...form, id: data.id, customer_id: customer!.id }]);
          resetForm();
        }
      }
    } catch (err) {
      toast(apiError(err, 'Failed to save'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      const { data } = await api.delete('/customers.php', { data: { id, action: 'address' } });
      if (data?.success) {
        toast('Address deleted', 'success');
        setAddresses(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      toast(apiError(err, 'Failed to delete'), 'error');
    }
    setDeleteId(null);
  };

  if (loading) return <Loader label="Loading addresses..." />;

  const labelIcons: Record<string, any> = { Home, Work: Briefcase, Other: Map };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Saved Addresses</h1>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <h3 className="mb-3 font-bold text-neutral-900">{editing ? 'Edit Address' : 'New Address'}</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Label</label>
                <select value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="input">
                  <option>Home</option><option>Work</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Full Name *</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone *</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Pincode *</label>
                <input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Address Line *</label>
              <textarea value={form.address_line} onChange={e => setForm({ ...form, address_line: e.target.value })} rows={2} className="input" />
            </div>
            <div>
              <label className="label">Landmark</label>
              <input value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">City</label>
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">State</label>
                <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="input" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked ? 1 : 0 })} className="accent-brand-500" />
              Set as default
            </label>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Address'}
              </button>
              <button onClick={resetForm} className="rounded-xl border border-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <EmptyState icon={<MapPin size={48} />} title="No addresses saved" subtitle="Add a delivery address to get started" />
      ) : (
        <div className="space-y-3">
          {addresses.map(a => {
            const Icon = labelIcons[a.label || ''] || MapPin;
            return (
              <div key={a.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-500">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-neutral-900">{a.full_name}</p>
                      <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">{a.label}</span>
                      {a.is_default === 1 && <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-600">Default</span>}
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{a.phone}</p>
                    <p className="text-sm text-neutral-500">{a.address_line}, {a.landmark && `${a.landmark}, `}{a.city}, {a.state} - {a.pincode}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(a)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteId(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="font-bold text-neutral-900">Delete Address?</h3>
            <p className="mt-2 text-sm text-neutral-500">This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
              <button onClick={() => remove(deleteId)} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
