import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { money } from '../../lib/settings';
import { AdminLayout, Modal, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { Order, OrderStatus, PaymentStatus } from '../../types';
import { Eye, X } from 'lucide-react';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/orders.php?per_page=100')
      .then(({ data }) => setOrders(data.data || data.orders || []))
      .catch(() => toast(apiError(null, 'Failed to load orders'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const openDetail = (o: Order) => {
    setDetail(o);
    setEditForm({ order_status: o.order_status, payment_status: o.payment_status });
  };

  const updateStatus = async () => {
    if (!detail) return;
    setUpdating(true);
    try {
      await adminApi.put('/orders.php', { id: detail.id, ...editForm });
      toast('Order updated', 'success');
      setOrders(prev => prev.map(o => o.id === detail.id ? { ...o, ...editForm } : o));
      setDetail({ ...detail, ...editForm });
    } catch (err) {
      toast(apiError(err, 'Update failed'), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = statusFilter ? orders.filter(o => o.order_status === statusFilter) : orders;

  return (
    <AdminLayout title="Orders">
      <PageHeader title="Orders" action={
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-48">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      } />

      {loading ? <Loader /> : filtered.length === 0 ? (
        <EmptyState icon={<Eye size={40} />} title="No orders found" subtitle="Orders will appear here once placed" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Order Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3 font-semibold text-neutral-900">{o.order_number}</td>
                  <td className="p-3">
                    <p className="font-medium text-neutral-700">{o.delivery_name}</p>
                    <p className="text-xs text-neutral-400">{o.delivery_phone}</p>
                  </td>
                  <td className="p-3 font-bold text-neutral-900">{money(o.total_amount)}</td>
                  <td className="p-3"><Badge status={o.order_status}>{o.order_status.replace(/_/g, ' ')}</Badge></td>
                  <td className="p-3"><Badge status={o.payment_status}>{o.payment_status}</Badge></td>
                  <td className="p-3 text-neutral-500">{o.created_at?.slice(0, 16)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => openDetail(o)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-500 ml-auto"><Eye size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Order ${detail?.order_number || ''}`} size="lg">
        {detail && (
          <div className="space-y-4">
            {/* Customer & delivery info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-bold uppercase text-neutral-400">Customer</p>
                <p className="mt-1 font-semibold text-neutral-900">{detail.delivery_name}</p>
                <p className="text-sm text-neutral-500">{detail.delivery_phone}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-bold uppercase text-neutral-400">Delivery Address</p>
                <p className="mt-1 text-sm text-neutral-600">{detail.delivery_address}</p>
                <p className="text-sm text-neutral-500">{detail.delivery_landmark} {detail.delivery_pincode}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-neutral-400">Items</p>
              <div className="overflow-x-auto rounded-xl ring-1 ring-neutral-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.items || []).map((it: any) => (
                      <tr key={it.id} className="border-b border-neutral-50">
                        <td className="p-2.5 font-medium text-neutral-700">{it.product_name}</td>
                        <td className="p-2.5 text-neutral-500">{it.quantity}</td>
                        <td className="p-2.5 text-neutral-500">{money(it.unit_price)}</td>
                        <td className="p-2.5 text-right font-semibold text-neutral-900">{money(it.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-xl bg-neutral-50 p-3 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-medium">{money(detail.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Delivery Charge</span><span className="font-medium">{money(detail.delivery_charge)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Tax</span><span className="font-medium">{money(detail.tax_amount)}</span></div>
              {parseFloat(String(detail.discount_amount || 0)) > 0 && <div className="flex justify-between"><span className="text-neutral-500">Discount</span><span className="font-medium text-green-600">-{money(detail.discount_amount)}</span></div>}
              <div className="mt-1 flex justify-between border-t border-neutral-200 pt-1"><span className="font-bold">Total</span><span className="font-bold text-brand-600">{money(detail.total_amount)}</span></div>
            </div>

            {/* Status update */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Order Status</label>
                <select value={editForm.order_status || ''} onChange={e => setEditForm({ ...editForm, order_status: e.target.value })} className="input">
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Payment Status</label>
                <select value={editForm.payment_status || ''} onChange={e => setEditForm({ ...editForm, payment_status: e.target.value })} className="input">
                  {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDetail(null)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Close</button>
              <button onClick={updateStatus} disabled={updating} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
