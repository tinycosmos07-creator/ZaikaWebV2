import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Product } from '../types';
import ProductCard from '../components/ProductCard';
import Loader, { EmptyState } from '../components/Loader';
import { Heart } from 'lucide-react';

export default function Wishlist() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wishlist.php')
      .then(({ data }) => {
        const items = data.data || [];
        setProducts(items.map((i: any) => i.product || i).filter(Boolean));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading wishlist..." />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-2xl font-bold text-neutral-900">My Wishlist</h1>
      {products.length === 0 ? (
        <EmptyState
          icon={<Heart size={48} />}
          title="Your wishlist is empty"
          subtitle="Save your favourite dishes for later"
          action={<Link to="/menu" className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">Browse Menu</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
