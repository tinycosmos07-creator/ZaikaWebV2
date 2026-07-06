import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { GridSkeleton, EmptyState } from '../components/Loader';
import { Search, SlidersHorizontal, X, Leaf, Flame } from 'lucide-react';

export default function Menu() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') || '');
  const [activeCat, setActiveCat] = useState(params.get('category') || '');
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (activeCat) q.set('category_slug', activeCat);
      if (search) q.set('search', search);
      if (vegOnly) q.set('is_veg', '1');
      q.set('per_page', '100');
      const { data } = await api.get(`/products.php?${q.toString()}`);
      let list: Product[] = data.data || [];
      if (sortBy === 'price_low') list = [...list].sort((a, b) => parseFloat(String(a.price)) - parseFloat(String(b.price)));
      if (sortBy === 'price_high') list = [...list].sort((a, b) => parseFloat(String(b.price)) - parseFloat(String(a.price)));
      if (sortBy === 'rating') list = [...list].sort((a, b) => parseFloat(String(b.rating)) - parseFloat(String(a.rating)));
      setProducts(list);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCat, search, vegOnly, sortBy]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    api.get('/categories.php').then(({ data }) => setCategories(data.data || [])).catch(() => {});
  }, []);

  const updateParams = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-2xl font-bold text-neutral-900">Our Menu</h1>

      {/* Search + Filter bar */}
      <div className="mb-5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); updateParams('search', e.target.value); }}
            placeholder="Search dishes..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 lg:hidden"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto bg-white p-5 shadow-xl transition-transform lg:sticky lg:top-20 lg:z-0 lg:w-56 lg:translate-x-0 lg:rounded-2xl lg:bg-neutral-50 lg:p-4 lg:shadow-none ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <h3 className="font-bold">Filters</h3>
            <button onClick={() => setShowFilters(false)}><X size={18} /></button>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase text-neutral-400">Categories</p>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveCat(''); updateParams('category', ''); }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${!activeCat ? 'bg-brand-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                All Items
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setActiveCat(c.slug); updateParams('category', c.slug); }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${activeCat === c.slug ? 'bg-brand-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase text-neutral-400">Food Type</p>
            <button
              onClick={() => setVegOnly(v => !v)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${vegOnly ? 'bg-green-50 text-green-600' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              <Leaf size={16} /> Veg Only
            </button>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase text-neutral-400">Sort By</p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
            >
              <option value="popular">Popular</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </aside>

        {showFilters && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setShowFilters(false)} />}

        {/* Products */}
        <div className="flex-1">
          {loading ? (
            <GridSkeleton count={8} />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <EmptyState
              icon={<Flame size={40} />}
              title="No dishes found"
              subtitle="Try changing your filters or search query"
            />
          )}
        </div>
      </div>
    </div>
  );
}
