import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { money, effectivePrice } from '../lib/settings';
import type { Product, Review } from '../types';
import Loader from '../components/Loader';
import { Star, Clock, Plus, Minus, ArrowLeft, Leaf, Flame, Shield, Truck } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add, getQty, setQty } = useCart();
  const { customer } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'description' | 'ingredients' | 'reviews'>('description');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/products.php?id=${id}`).then(r => r.data?.product).catch(() => null),
      api.get(`/reviews.php?product_id=${id}`).then(r => r.data?.data || []).catch(() => []),
    ]).then(([p, r]) => {
      setProduct(p);
      setReviews(r);
      setLoading(false);
    });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    add(product);
    toast(`${product.name} added to cart!`, 'success');
  };

  const handleBuyNow = () => {
    if (!product) return;
    add(product);
    navigate('/cart');
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) { toast('Please sign in to review', 'info'); navigate('/login'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews.php', { product_id: id, rating: newRating, comment: newComment });
      if (data?.success) {
        toast('Review submitted! Awaiting approval.', 'success');
        setNewComment('');
        setNewRating(5);
        setReviews(prev => [...prev, data.review]);
      } else throw new Error(data?.message);
    } catch (err: any) {
      toast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading product..." />;
  if (!product) return (
    <div className="py-20 text-center">
      <p className="text-lg font-semibold text-neutral-700">Product not found</p>
      <Link to="/menu" className="mt-4 inline-block text-brand-500 hover:underline">Back to menu</Link>
    </div>
  );

  const price = effectivePrice(product);
  const original = parseFloat(String(product.price));
  const hasDiscount = price < original;
  const qty = getQty(product.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-brand-500">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Image */}
        <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
          <img src={product.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=600'} alt={product.name} className="aspect-square w-full object-cover" />
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white">
              {Math.round((1 - price / original) * 100)}% OFF
            </span>
          )}
          <div className="absolute right-3 top-3">
            <div className={`grid h-7 w-7 place-items-center rounded border-2 bg-white ${product.is_veg ? 'border-green-600' : 'border-red-600'}`}>
              <div className={`h-3.5 w-3.5 rounded-full ${product.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
            </div>
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">{product.category_name}</p>
          <h1 className="mt-1 text-2xl font-black text-neutral-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
              <Star size={11} className="fill-white" /> {product.avg_rating ?? product.rating}
            </span>
            <span className="text-sm text-neutral-400">{product.review_count ?? 0} reviews</span>
            <span className="flex items-center gap-1 text-sm text-neutral-400"><Clock size={13} /> {product.preparation_time}m</span>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-black text-neutral-900">{money(price)}</span>
            {hasDiscount && <span className="mb-1 text-lg text-neutral-400 line-through">{money(original)}</span>}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-neutral-600">{product.description}</p>

          {/* Add to cart */}
          <div className="mt-6 flex items-center gap-3">
            {qty === 0 ? (
              <button onClick={handleAddToCart} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600">
                <Plus size={18} /> Add to Cart
              </button>
            ) : (
              <div className="flex flex-1 items-center justify-center gap-0 overflow-hidden rounded-xl border-2 border-brand-500">
                <button onClick={() => setQty(product.id, qty - 1)} className="grid h-12 w-12 place-items-center bg-brand-500 text-white hover:bg-brand-600">
                  <Minus size={18} />
                </button>
                <span className="min-w-12 bg-white text-center text-lg font-bold text-brand-600">{qty}</span>
                <button onClick={() => setQty(product.id, qty + 1)} className="grid h-12 w-12 place-items-center bg-brand-500 text-white hover:bg-brand-600">
                  <Plus size={18} />
                </button>
              </div>
            )}
            <button onClick={handleBuyNow} className="rounded-xl border-2 border-brand-500 px-6 py-3 text-sm font-bold text-brand-600 transition hover:bg-brand-50">
              Buy Now
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'Fast Delivery' },
              { icon: Shield, label: '100% Hygienic' },
              { icon: Clock, label: `${product.preparation_time}m Prep` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-neutral-50 p-3 text-center">
                <Icon size={18} className="text-brand-500" />
                <span className="text-[10px] font-semibold text-neutral-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-neutral-200">
        <div className="flex gap-6">
          {(['description', 'ingredients', 'reviews'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 pb-3 text-sm font-semibold capitalize transition ${tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="py-5">
        {tab === 'description' && <p className="text-sm leading-relaxed text-neutral-600">{product.description || 'No description available.'}</p>}
        {tab === 'ingredients' && <p className="text-sm leading-relaxed text-neutral-600">{product.ingredients || 'Ingredients information not available.'}</p>}
        {tab === 'reviews' && (
          <div>
            {/* Submit review */}
            <form onSubmit={submitReview} className="mb-6 rounded-2xl bg-neutral-50 p-4">
              <p className="mb-3 font-semibold text-neutral-900">Write a Review</p>
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setNewRating(i + 1)}>
                    <Star size={22} className={i < newRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'} />
                  </button>
                ))}
              </div>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="mb-3 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-brand-400"
              />
              <button type="submit" disabled={submitting} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>

            {/* Reviews list */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                          {(r.customer_name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{r.customer_name || 'Anonymous'}</p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-neutral-400">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-neutral-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-neutral-400">No reviews yet. Be the first to review!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
