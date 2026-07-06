import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchSettings, money } from '../lib/settings';
import type { Banner, Category, Product } from '../types';
import ProductCard from '../components/ProductCard';
import { GridSkeleton } from '../components/Loader';
import { Star, Truck, Clock, Shield, ChevronRight, Quote } from 'lucide-react';

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get('/banners.php').then(r => r.data?.data || []).catch(() => []),
      api.get('/categories.php').then(r => r.data?.data || []).catch(() => []),
      api.get('/products.php?is_featured=1&per_page=8').then(r => r.data?.data || []).catch(() => []),
    ]).then(([b, c, p]) => {
      setBanners(b);
      setCategories(c);
      setProducts(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const stats = [
    { label: 'Orders Delivered', value: '50K+', icon: Truck },
    { label: 'Avg Rating', value: '4.6', icon: Star },
    { label: 'Happy Customers', value: '12K+', icon: Shield },
    { label: 'Dishes on Menu', value: '120+', icon: Clock },
  ];

  const features = [
    { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹499' },
    { icon: Clock, title: 'Fast Delivery', desc: 'Within 30-45 minutes' },
    { icon: Shield, title: '100% Hygienic', desc: 'Quality guaranteed' },
  ];

  return (
    <div>
      {/* Hero Banner */}
      {banners.length > 0 && (
        <div className="relative h-[280px] overflow-hidden sm:h-[400px]">
          {banners.map((b, i) => (
            <div
              key={b.id}
              className={`absolute inset-0 transition-opacity duration-700 ${i === bannerIdx ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12">
                <div className="mx-auto max-w-7xl">
                  <h2 className="text-2xl font-black text-white sm:text-4xl">{b.title}</h2>
                  {b.subtitle && <p className="mt-1 text-sm text-white/80 sm:text-lg">{b.subtitle}</p>}
                  {b.cta_text && b.link_url && (
                    <Link to={b.link_url} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand-600">
                      {b.cta_text} <ChevronRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <section className="border-b border-neutral-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4 sm:px-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500">
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xl font-black text-neutral-900">{value}</p>
                <p className="text-xs text-neutral-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Browse by Category</h2>
            <Link to="/menu" className="text-sm font-semibold text-brand-500 hover:text-brand-700">View all</Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {categories.slice(0, 6).map(c => (
              <Link
                key={c.id}
                to={`/menu?category=${c.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-100">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-110" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">🍽️</div>
                  )}
                </div>
                <p className="text-center text-xs font-semibold text-neutral-700">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Featured Dishes</h2>
          <Link to="/menu" className="text-sm font-semibold text-brand-500 hover:text-brand-700">View all</Link>
        </div>
        {loading ? (
          <GridSkeleton count={8} />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="py-12 text-center text-neutral-400">No featured products yet.</p>
        )}
      </section>

      {/* Features */}
      <section className="bg-neutral-50 py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:px-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-500">
                <Icon size={22} />
              </div>
              <div>
                <p className="font-bold text-neutral-900">{title}</p>
                <p className="text-sm text-neutral-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-6 text-center text-xl font-bold text-neutral-900 sm:text-2xl">What Our Customers Say</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { name: 'Rahul Sharma', text: 'Best biryani in town! The delivery was super fast and the food was still hot.', rating: 5 },
            { name: 'Priya Singh', text: 'Amazing flavors and great variety. The kebabs are a must-try!', rating: 5 },
            { name: 'Amit Kumar', text: 'Ordered for a family gathering. Everyone loved it. Will order again!', rating: 4 },
          ].map(t => (
            <div key={t.name} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
              <Quote size={24} className="text-brand-200" />
              <p className="mt-2 text-sm text-neutral-600">{t.text}</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'} />
                  ))}
                </div>
                <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-500 to-brand-600 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-black text-white sm:text-3xl">Hungry? Order Now!</h2>
          <p className="mt-2 text-white/80">Get your favourite dishes delivered to your doorstep.</p>
          <Link to="/menu" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-600 shadow-lg transition hover:bg-neutral-50">
            Browse Menu <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
