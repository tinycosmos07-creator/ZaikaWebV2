import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { money } from '../lib/settings';
import type { Order } from '../types';
import Loader from '../components/Loader';
import { EmptyState } from '../components/Loader';
import { Package, Clock, CheckCircle, XCircle, Truck, ChefHat, ArrowLeft, X } from 'lucide-react';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing', out_for_delivery: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function Orders() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/orders.php?id=${id}`).then(({ data }) => {
        setOrder(data.order || null);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      api.get('/orders.php').then(({ data }) => {
        setOrders(data.data || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const cancelOrder = async (orderId: number) => {
    setCancelling(true);
    try {
      const { data } = await api.put('/orders.php', { id: orderId, order_status: 'cancelled' });
      if (data?.success) {
        toast('Order cancelled', 'success');
        if (id) { setOrder(prev => prev ? { ...prev, order_status: 'cancelled' } : null); }
        else { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: 'cancelled' } : o)); }
      }
    } catch (err) {
      toast(apiError(err, 'Failed to cancel'), 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Loader label="Loading orders..." />;

  // Detail view
  if (id) {
    if (!order) return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-neutral-700">Order not found</p>
        <Link to="/orders" className="mt-4 inline-block text-brand-500 hover:underline">Back to orders</Link>
      </div>
    );

    const canCancel = ['pending', 'confirmed'].includes(order.order_status);
    const currentStep = STATUS_STEPS.indexOf(order.order_status);

    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <button onClick={() => navigate('/orders')} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-brand-500">
          <ArrowLeft size={16} /> All Orders
        </button>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-neutral-900">Order #{order.order_number || order.id}</h1>
              <p className="text-sm text-neutral-400">{new Date(order.placed_at || order.created_at).toLocaleString('en-IN')}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' : order.order_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {STATUS_LABELS[order.order_status]}
            </span>
          </div>

          {/* Status tracker */}
          {order.order_status !== 'cancelled' && (
            <div className="mt-6 flex items-center justify-between">
              {STATUS_STEPS.map((step, i) => {
                const icons = [Clock, CheckCircle, ChefHat, Truck, Package];
                const Icon = icons[i];
                const done = i <= currentStep;
                return (
                  <div key={step} className="flex flex-1 flex-col items-center">
                    <div className={`grid h-10 w-10 place-items-center rounded-full ${done ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                      <Icon size={18} />
                    </div>
                    <p className={`mt-1 text-[10px] font-semibold ${done ? 'text-brand-600' : 'text-neutral-400'}`}>{STATUS_LABELS[step]}</p>
                    {i < STATUS_STEPS.length - 1 && <div className={`absolute h-0.5 ${done ? 'bg-brand-500' : 'bg-neutral-200'}`} style={{ left: `${(i / 4) * 100}%`, width: '25%' }} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Items */}
          <div className="mt-6 border-t border-neutral-100 pt-4">
            <h3 className="mb-3 font-bold text-neutral-900">Items</h3>
            <div className="space-y-2">
              {order.items?.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.product_image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=100'} alt={item.product_name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{item.product_name}</p>
                    <p className="text-xs text-neutral-400">Qty: {item.quantity} × {money(item.unit_price)}</p>
                  </div>
                  <p className="text-sm font-bold text-neutral-900">{money(item.total_price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery */}
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <h3 className="mb-2 font-bold text-neutral-900">Delivery Details</h3>
            <p className="text-sm text-neutral-600">{order.delivery_name} · {order.delivery_phone}</p>
            <p className="text-sm text-neutral-500">{order.delivery_address}, {order.delivery_pincode}</p>
          </div>

          {/* Summary */}
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{money(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Delivery</span><span>{money(order.delivery_charge)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Tax</span><span>{money(order.tax_amount)}</span></div>
              {parseFloat(String(order.discount_amount)) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{money(order.discount_amount)}</span></div>}
              <div className="flex justify-between border-t border-neutral-100 pt-1.5"><span className="font-bold">Total</span><span className="font-black text-brand-600">{money(order.total_amount)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Payment</span><span className="font-semibold capitalize">{order.payment_method} · {order.payment_status}</span></div>
            </div>
          </div>

          {canCancel && (
            <button onClick={() => cancelOrder(order.id)} disabled={cancelling} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 disabled:opacity-50">
              <X size={16} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // List view
  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState icon={<Package size={48} />} title="No orders yet" subtitle="Your order history will appear here" action={<Link to="/menu" className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">Browse Menu</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-2xl font-bold text-neutral-900">My Orders</h1>
      <div className="space-y-3">
        {orders.map(o => (
          <Link key={o.id} to={`/orders/${o.id}`} className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-neutral-900">Order #{o.order_number || o.id}</p>
                <p className="text-xs text-neutral-400">{new Date(o.placed_at || o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${o.order_status === 'cancelled' ? 'bg-red-100 text-red-700' : o.order_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {STATUS_LABELS[o.order_status]}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-neutral-500">{o.items?.length || 0} items</p>
              <p className="font-bold text-brand-600">{money(o.total_amount)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
