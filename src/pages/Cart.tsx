import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { money, effectivePrice } from '../lib/settings';
import { EmptyState } from '../components/Loader';
import { Plus, Minus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { items, subtotal, setQty, remove, clear } = useCart();
  const navigate = useNavigate();
  const deliveryCharge = subtotal >= 499 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + deliveryCharge + tax;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="Your cart is empty"
          subtitle="Browse our menu and add some delicious dishes!"
          action={
            <Link to="/menu" className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
              Browse Menu
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-2xl font-bold text-neutral-900">Your Cart</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="space-y-3">
            {items.map(({ product, quantity }) => {
              const price = effectivePrice(product);
              return (
                <div key={product.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-neutral-100">
                  <img src={product.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200'} alt={product.name} className="h-20 w-20 rounded-xl object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/product/${product.id}`} className="text-sm font-bold text-neutral-900 hover:text-brand-600">{product.name}</Link>
                        <p className="text-xs text-neutral-400">{product.category_name}</p>
                      </div>
                      <button onClick={() => remove(product.id)} className="text-neutral-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-0 overflow-hidden rounded-lg border-2 border-brand-500">
                        <button onClick={() => setQty(product.id, quantity - 1)} className="grid h-8 w-8 place-items-center bg-brand-500 text-white hover:bg-brand-600">
                          <Minus size={14} />
                        </button>
                        <span className="min-w-8 bg-white text-center text-sm font-bold text-brand-600">{quantity}</span>
                        <button onClick={() => setQty(product.id, quantity + 1)} className="grid h-8 w-8 place-items-center bg-brand-500 text-white hover:bg-brand-600">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-neutral-900">{money(price * quantity)}</p>
                        {product.discount_price && <p className="text-xs text-neutral-400">{money(price)} each</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={clear} className="mt-3 text-sm font-semibold text-neutral-400 hover:text-red-500">Clear cart</button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <h3 className="mb-4 font-bold text-neutral-900">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-semibold">{money(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Delivery</span><span className="font-semibold">{deliveryCharge === 0 ? 'FREE' : money(deliveryCharge)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Tax (5%)</span><span className="font-semibold">{money(tax)}</span></div>
              <div className="border-t border-neutral-100 pt-2">
                <div className="flex justify-between"><span className="font-bold text-neutral-900">Total</span><span className="text-lg font-black text-brand-600">{money(total)}</span></div>
              </div>
            </div>
            {deliveryCharge > 0 && (
              <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-600">
                Add {money(499 - subtotal)} more for FREE delivery!
              </p>
            )}
            <button onClick={() => navigate('/checkout')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600">
              Checkout <ArrowRight size={16} />
            </button>
            <Link to="/menu" className="mt-2 block text-center text-sm font-semibold text-neutral-500 hover:text-brand-500">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
