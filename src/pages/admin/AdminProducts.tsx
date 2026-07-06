import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money, effectivePrice } from '../../lib/settings';
import { AdminLayout, Modal, ConfirmDialog, Badge, PageHeader } from '../../components/admin/AdminLayout';
import ImageUpload from '../../components/ImageUpload';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { Product, Category } from '../../types';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/products.php?show_all=1&per_page=100').then(({ data }) => {
      setProducts(data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
    adminApi.get('/categories.php?all=1').then(({ data }) => setCategories(data.data || [])).catch(() => {});
  }, []);

  const startAdd = () => {
    setEditing(null);
    setForm({ name: '', category_id: '', price: '', discount_price: '', description: '', ingredients: '', image_url: '', is_veg: 1, is_featured: 0, is_best_seller: 0, preparation_time: 20, rating: 4.0, sort_order: 0, stock_status: 'in_stock', is_active: 1 });
    setShowForm(true);
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put('/products.php', { ...form, id: editing.id });
        toast('Product updated', 'success');
      } else {
        await adminApi.post('/products.php', form);
        toast('Product created', 'success');
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
      await adminApi.delete('/products.php', { data: { id: deleteId } });
      toast('Product deleted', 'success');
      setProducts(prev => prev.filter(p => p.id !== deleteId));
    } catch (err) {
      toast(apiError(err, 'Delete failed'), 'error');
    }
    setDeleteId(null);
  };

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && p.category_id !== parseInt(catFilter)) return false;
    return true;
  });

  return (
    <AdminLayout title="Products">
      <PageHeader title="Products" action={
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          <Plus size={16} /> Add Product
        </button>
      } />

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="input pl-10" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input w-48">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : filtered.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No products found" subtitle="Add your first product to get started" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img src={p.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=100'} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold text-neutral-900">{p.name}</p>
                        <div className="flex gap-1">
                          {p.is_veg === 1 && <span className="text-[10px] text-green-600">Veg</span>}
                          {p.is_featured === 1 && <span className="text-[10px] text-amber-600">Featured</span>}
                          {p.is_best_seller === 1 && <span className="text-[10px] text-blue-600">Bestseller</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-neutral-500">{p.category_name || '—'}</td>
                  <td className="p-3">
                    <span className="font-bold text-neutral-900">{money(effectivePrice(p))}</span>
                    {p.discount_price && <span className="ml-1 text-xs text-neutral-400 line-through">{money(p.price)}</span>}
                  </td>
                  <td className="p-3"><Badge status={p.is_active ? 'active' : 'inactive'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(p)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Category *</label>
              <select required value={form.category_id || ''} onChange={e => setForm({ ...form, category_id: e.target.value })} className="input">
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Price *</label>
              <input type="number" step="0.01" required value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Discount Price</label>
              <input type="number" step="0.01" value={form.discount_price || ''} onChange={e => setForm({ ...form, discount_price: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input" />
          </div>
          <div>
            <label className="label">Ingredients</label>
            <textarea value={form.ingredients || ''} onChange={e => setForm({ ...form, ingredients: e.target.value })} rows={2} className="input" />
          </div>
          <ImageUpload value={form.image_url || ''} onChange={url => setForm({ ...form, image_url: url })} label="Product Image" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Prep Time (min)</label>
              <input type="number" value={form.preparation_time || 20} onChange={e => setForm({ ...form, preparation_time: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Rating</label>
              <input type="number" step="0.1" max="5" value={form.rating || 4} onChange={e => setForm({ ...form, rating: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Stock Status</label>
            <select value={form.stock_status || 'in_stock'} onChange={e => setForm({ ...form, stock_status: e.target.value })} className="input">
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'is_veg', label: 'Veg' },
              { key: 'is_featured', label: 'Featured' },
              { key: 'is_best_seller', label: 'Bestseller' },
              { key: 'is_active', label: 'Active' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <input type="checkbox" checked={!!form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked ? 1 : 0 })} className="accent-brand-500" />
                {label}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete Product?" message="This will permanently delete the product." />
    </AdminLayout>
  );
}
