import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money } from '../../lib/settings';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { InventoryItem, Supplier } from '../../types';
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';

export default function AdminInventory() {
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTxn, setShowTxn] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [form, setForm] = useState<any>({});
  const [txnForm, setTxnForm] = useState<any>({ item_id: '', type: 'in', quantity: '', notes: '' });
  const [txnItem, setTxnItem] = useState<InventoryItem | null>(null);

  const fetch = () => {
    setLoading(true);
    adminApi.get('/inventory.php')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load inventory'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
    adminApi.get('/suppliers.php').then(({ data }) => setSuppliers(data.data || [])).catch(() => {});
  }, []); // eslint-disable-line

  const startAdd = () => {
    setEditing(null);
    setForm({ name: '', category: '', unit: 'kg', current_stock: '', min_stock_level: '', cost_per_unit: '', supplier_id: '', is_active: 1 });
    setShowForm(true);
  };

  const startEdit = (i: InventoryItem) => {
    setEditing(i);
    setForm({ ...i });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/inventory.php', { ...form, id: editing.id });
        toast('Item updated', 'success');
      } else {
        await adminApi.post('/inventory.php', form);
        toast('Item created', 'success');
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
      await adminApi.delete('/inventory.php', { data: { id: deleteId } });
      toast('Item deleted', 'success');
      setItems(prev => prev.filter(i => i.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  const openTxn = (i: InventoryItem) => {
    setTxnItem(i);
    setTxnForm({ item_id: i.id, type: 'in', quantity: '', notes: '' });
    setShowTxn(true);
  };

  const submitTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnForm.quantity || parseFloat(txnForm.quantity) <= 0) { toast('Quantity must be > 0', 'error'); return; }
    setSaving(true);
    try {
      await adminApi.post('/inventory.php', { action: 'transaction', ...txnForm });
      toast('Transaction recorded', 'success');
      setShowTxn(false);
      fetch();
    } catch (err) {
      toast(apiError(err, 'Transaction failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = lowStockOnly
    ? items.filter(i => parseFloat(String(i.current_stock)) <= parseFloat(String(i.min_stock_level)))
    : items;

  const stockLevel = (i: InventoryItem) => {
    const cur = parseFloat(String(i.current_stock));
    const min = parseFloat(String(i.min_stock_level));
    if (cur <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700', bar: 'bg-red-500', pct: 0 };
    if (cur <= min) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', pct: 25 };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700', bar: 'bg-green-500', pct: 75 };
  };

  return (
    <AdminLayout title="Inventory">
      <PageHeader title="Inventory" action={
        <div className="flex gap-2">
          <button
            onClick={() => setLowStockOnly(v => !v)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold ${lowStockOnly ? 'bg-amber-500 text-white' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'}`}
          >
            <AlertTriangle size={16} /> Low Stock
          </button>
          <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
            <Plus size={16} /> Add Item
          </button>
        </div>
      } />

      {loading ? <Loader /> : filtered.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No inventory items" subtitle="Add your first inventory item" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Item</th>
                <th className="p-3">Category</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Min Level</th>
                <th className="p-3">Cost/Unit</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const sl = stockLevel(i);
                return (
                  <tr key={i.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="p-3 font-semibold text-neutral-900">{i.name}</td>
                    <td className="p-3 text-neutral-500">{i.category || '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
                          <div className={`h-full ${sl.bar}`} style={{ width: `${sl.pct}%` }} />
                        </div>
                        <span className="font-medium text-neutral-700">{i.current_stock} {i.unit}</span>
                      </div>
                    </td>
                    <td className="p-3 text-neutral-500">{i.min_stock_level} {i.unit}</td>
                    <td className="p-3 text-neutral-500">{i.cost_per_unit ? money(i.cost_per_unit) : '—'}</td>
                    <td className="p-3 text-neutral-500">{i.supplier_name || '—'}</td>
                    <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sl.color}`}>{sl.label}</span></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openTxn(i)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-green-50 hover:text-green-500" title="Add Transaction"><ArrowUpCircle size={15} /></button>
                        <button onClick={() => startEdit(i)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(i.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Item Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Item' : 'Add Item'}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <input value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Unit *</label>
              <select required value={form.unit || 'kg'} onChange={e => setForm({ ...form, unit: e.target.value })} className="input">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">litre</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
                <option value="box">box</option>
                <option value="pack">pack</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Current Stock</label>
              <input type="number" step="0.01" value={form.current_stock || ''} onChange={e => setForm({ ...form, current_stock: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Min Stock Level</label>
              <input type="number" step="0.01" value={form.min_stock_level || ''} onChange={e => setForm({ ...form, min_stock_level: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cost Per Unit</label>
              <input type="number" step="0.01" value={form.cost_per_unit || ''} onChange={e => setForm({ ...form, cost_per_unit: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Supplier</label>
              <select value={form.supplier_id || ''} onChange={e => setForm({ ...form, supplier_id: e.target.value })} className="input">
                <option value="">None</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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

      {/* Transaction Modal */}
      <Modal open={showTxn} onClose={() => setShowTxn(false)} title={`Stock Transaction — ${txnItem?.name || ''}`}>
        <form onSubmit={submitTxn} className="space-y-3">
          <div>
            <label className="label">Transaction Type *</label>
            <select required value={txnForm.type || 'in'} onChange={e => setTxnForm({ ...txnForm, type: e.target.value })} className="input">
              <option value="in">Stock In (Purchase)</option>
              <option value="out">Stock Out (Usage)</option>
              <option value="adjustment">Adjustment</option>
              <option value="waste">Waste</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input type="number" step="0.01" required value={txnForm.quantity || ''} onChange={e => setTxnForm({ ...txnForm, quantity: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={txnForm.notes || ''} onChange={e => setTxnForm({ ...txnForm, notes: e.target.value })} rows={2} className="input" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowTxn(false)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Item?" message="This will permanently delete the inventory item." />
    </AdminLayout>
  );
}
