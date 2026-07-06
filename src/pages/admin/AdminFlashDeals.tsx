import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money, effectivePrice } from '../../lib/settings';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { FlashDeal, Product } from '../../types';
import { Plus, Pencil, Trash2, Zap } from 'lucide-react';

export default function AdminFlashDeals() {
  const toast = useToast();
  const [items, setItems] = useState<FlashDeal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FlashDeal | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/flash-deals.php')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load flash deals'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
    adminApi.get('/products.php?show_all=1&per_page=100')
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {});
  }, []); // eslint-disable-line

  const startAdd = () => {
    setEditing(null);
    const now = new Date();
    const end = new Date(); end.setHours(end.getHours() + 6);
    setForm({ product_id: '', deal_price: '', start_time: now.toISOString().slice(0, 16), end_time: end.toISOString().slice(0, 16), max_quantity: 50, is_active: 1 });
    setShowForm(true);
  };

  const startEdit = (d: FlashDeal) => {
    setEditing(d);
    setForm({
      ...d,
      start_time: d.start_time?.slice(0, 16) || '',
      end_time: d.end_time?.slice(0, 16) || '',
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id) { toast('Product is required', 'error'); return; }
    if (!form.deal_price) { toast('Deal price is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/flash-deals.php', { ...form, id: editing.id });
        toast('Flash deal updated', 'success');
      } else {
        await adminApi.post('/flash-deals.php', form);
        toast('Flash deal created', 'success');
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
      await adminApi.delete('/flash-deals.php', { data: { id: deleteId } });
      toast('Flash deal deleted', 'success');
      setItems(prev => prev.filter(d => d.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  const isDealActive = (d: FlashDeal) => {
    if (!d.is_active) return false;
    const now = new Date();
    const start = new Date(d.start_time);
    const end = new Date(d.end_time);
    return now >= start && now <= end;
  };

  return (
    <AdminLayout title="Flash Deals">
      <PageHeader title="Flash Deals" action={
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Deal
        </button>
      } />

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState icon={<Zap size={40} />} title="No flash deals found" subtitle="Create a flash deal to boost sales" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Product</th>
                <th className="p-3">Deal Price</th>
                <th className="p-3">Original Price</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Sold/Max</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(d => {
                const active = isDealActive(d);
                return (
                  <tr key={d.id} className={`border-b border-neutral-50 hover:bg-neutral-50 ${active ? 'bg-amber-50/50' : ''}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {d.product_image && <img src={d.product_image} alt="" className="h-8 w-8 rounded-lg object-cover" />}
                        <span className="font-semibold text-neutral-900">{d.product_name || `Product #${d.product_id}`}</span>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-brand-600">{money(d.deal_price)}</td>
                    <td className="p-3 text-neutral-400 line-through">{money(d.original_price)}</td>
                    <td className="p-3 text-neutral-500">{d.start_time?.slice(0, 16) || '—'}</td>
                    <td className="p-3 text-neutral-500">{d.end_time?.slice(0, 16) || '—'}</td>
                    <td className="p-3 text-neutral-500">{d.sold_count || 0}/{d.max_quantity}</td>
                    <td className="p-3">
                      {active ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"><Zap size={11} /> Live</span> :
                       <Badge status={d.is_active ? 'active' : 'inactive'}>{d.is_active ? 'Active' : 'Inactive'}</Badge>}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => startEdit(d)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(d.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Flash Deal' : 'Add Flash Deal'}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Product *</label>
            <select required value={form.product_id || ''} onChange={e => {
              const p = products.find(pr => pr.id === parseInt(e.target.value));
              setForm({ ...form, product_id: e.target.value, original_price: p ? effectivePrice(p) : form.original_price });
            }} className="input">
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} — {money(effectivePrice(p))}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Deal Price *</label>
            <input type="number" step="0.01" required value={form.deal_price || ''} onChange={e => setForm({ ...form, deal_price: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Time *</label>
              <input type="datetime-local" required value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">End Time *</label>
              <input type="datetime-local" required value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Max Quantity</label>
              <input type="number" value={form.max_quantity || 50} onChange={e => setForm({ ...form, max_quantity: e.target.value })} className="input" />
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

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Flash Deal?" message="This will permanently delete the flash deal." />
    </AdminLayout>
  );
}
