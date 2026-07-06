import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { money } from '../lib/settings';
import type { Address } from '../types';
import Loader from '../components/Loader';
import { MapPin, Tag, CreditCard, Wallet, Banknote, MessageSquare, Check, X } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { customer } = useAuth();
  const toast = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState<number | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [notes, setNotes] = useState('');
  const [addrForm, setAddrForm] = useState({ full_name: '', phone: '', address_line: '', landmark: '', city: 'Muzaffarnagar', state: 'Uttar Pradesh', pincode: '', label: 'Home' });

  useEffect(() => {
    if (items.length === 0) { navigate('/cart'); return; }
    if (!customer) { navigate('/login?redirect=/checkout'); return; }
    api.get('/customers.php?addresses=1')
      .then(({ data }) => {
        setAddresses(data.data || []);
        if (data.data?.length > 0) setSelectedAddr(data.data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customer, items.length, navigate]);

  const deliveryCharge = subtotal >= 499 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const discount = appliedCoupon ? (appliedCoupon.discount_type === 'percentage' ? Math.min(subtotal * parseFloat(appliedCoupon.discount_value) / 100, parseFloat(appliedCoupon.max_discount || '999999')) : parseFloat(appliedCoupon.discount_value)) : 0;
  const total = subtotal + deliveryCharge + tax - discount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      const { data } = await api.get(`/delivery.php?resource=coupons&code=${encodeURIComponent(couponCode.trim())}`);
      if (data?.success && data.coupon) {
        if (parseFloat(data.coupon.min_order_value) > subtotal) {
          setCouponError(`Minimum order ${money(data.coupon.min_order_value)} required`);
          return;
        }
        setAppliedCoupon(data.coupon);
        toast('Coupon applied!', 'success');
      } else {
        setCouponError(data?.message || 'Invalid coupon');
      }
    } catch (err) {
      setCouponError(apiError(err, 'Failed to apply coupon'));
    }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(''); setCouponError(''); };

  const saveAddress = async () => {
    if (!addrForm.full_name || !addrForm.phone || !addrForm.address_line || !addrForm.pincode) {
      toast('Please fill all required fields', 'error');
      return;
    }
    try {
      const { data } = await api.post('/customers.php', { ...addrForm, action: 'address' });
      if (data?.success) {
        toast('Address saved', 'success');
        const newAddr = { ...addrForm, id: data.id, customer_id: customer!.id, is_default: 0 };
        setAddresses(prev => [...prev, newAddr]);
        setSelectedAddr(data.id);
        setShowAddrForm(false);
        setAddrForm({ full_name: '', phone: '', address_line: '', landmark: '', city: 'Muzaffarnagar', state: 'Uttar Pradesh', pincode: '', label: 'Home' });
      }
    } catch (err) {
      toast(apiError(err, 'Failed to save address'), 'error');
    }
  };

  const placeOrder = async () => {
    if (!selectedAddr) { toast('Please select a delivery address', 'error'); return; }
    setPlacing(true);
    try {
      const orderData = {
        address_id: selectedAddr,
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity, unit_price: i.product.discount_price || i.product.price })),
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code || null,
        notes,
        subtotal,
        delivery_charge: deliveryCharge,
        tax_amount: tax,
        discount_amount: discount,
        total_amount: total,
      };
      const { data } = await api.post('/orders.php', orderData);
      if (data?.success) {
        clear();
        toast('Order placed successfully!', 'success');
        navigate(`/orders/${data.order_id || data.id}`);
      } else {
        throw new Error(data?.message || 'Failed to place order');
      }
    } catch (err) {
      toast(apiError(err, 'Failed to place order'), 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Loader label="Loading checkout..." />;

  const paymentMethods = [
    { key: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
    { key: 'upi', label: 'UPI Payment', icon: Wallet, desc: 'Pay via UPI app' },
    { key: 'whatsapp', label: 'WhatsApp Order', icon: MessageSquare, desc: 'Order via WhatsApp' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-2xl font-bold text-neutral-900">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Address */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-neutral-900"><MapPin size={18} className="text-brand-500" /> Delivery Address</h3>
            {addresses.length > 0 && !showAddrForm && (
              <div className="space-y-2">
                {addresses.map(a => (
                  <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${selectedAddr === a.id ? 'border-brand-500 bg-brand-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <input type="radio" name="address" checked={selectedAddr === a.id} onChange={() => setSelectedAddr(a.id)} className="mt-1 accent-brand-500" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{a.full_name} · {a.phone}</p>
                      <p className="text-sm text-neutral-500">{a.address_line}, {a.landmark && `${a.landmark}, `}{a.city}, {a.state} - {a.pincode}</p>
                      <span className="mt-1 inline-block rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">{a.label || 'Address'}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {showAddrForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Full Name *" value={addrForm.full_name} onChange={e => setAddrForm({ ...addrForm, full_name: e.target.value })} className="input" />
                  <input placeholder="Phone *" value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} className="input" />
                </div>
                <input placeholder="Address Line *" value={addrForm.address_line} onChange={e => setAddrForm({ ...addrForm, address_line: e.target.value })} className="input" />
                <input placeholder="Landmark" value={addrForm.landmark} onChange={e => setAddrForm({ ...addrForm, landmark: e.target.value })} className="input" />
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="City *" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} className="input" />
                  <input placeholder="State" value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} className="input" />
                  <input placeholder="Pincode *" value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} className="input" />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveAddress} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Save Address</button>
                  <button onClick={() => setShowAddrForm(false)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddrForm(true)} className="mt-3 text-sm font-semibold text-brand-500 hover:text-brand-700">+ Add new address</button>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-neutral-900"><CreditCard size={18} className="text-brand-500" /> Payment Method</h3>
            <div className="space-y-2">
              {paymentMethods.map(({ key, label, icon: Icon, desc }) => (
                <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition ${paymentMethod === key ? 'border-brand-500 bg-brand-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === key} onChange={() => setPaymentMethod(key)} className="accent-brand-500" />
                  <Icon size={20} className="text-neutral-500" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{label}</p>
                    <p className="text-xs text-neutral-400">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <h3 className="mb-3 font-bold text-neutral-900">Order Notes (Optional)</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2} className="input" />
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <h3 className="mb-4 font-bold text-neutral-900">Order Summary</h3>
            {/* Coupon */}
            <div className="mb-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl bg-green-50 p-3">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-green-600" />
                    <div>
                      <p className="text-sm font-bold text-green-700">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600">{appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% off` : `${money(appliedCoupon.discount_value)} off`}</p>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="input flex-1" />
                    <button onClick={applyCoupon} className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800">Apply</button>
                  </div>
                  {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-semibold">{money(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Delivery</span><span className="font-semibold">{deliveryCharge === 0 ? 'FREE' : money(deliveryCharge)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Tax (5%)</span><span className="font-semibold">{money(tax)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-semibold">-{money(discount)}</span></div>}
              <div className="border-t border-neutral-100 pt-2">
                <div className="flex justify-between"><span className="font-bold text-neutral-900">Total</span><span className="text-lg font-black text-brand-600">{money(total)}</span></div>
              </div>
            </div>
            <button onClick={placeOrder} disabled={placing || !selectedAddr} className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50">
              {placing ? 'Placing order...' : `Place Order · ${money(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
