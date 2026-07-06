import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { apiError } from '../lib/api';
import { money } from '../lib/settings';
import { User, Mail, Phone, MapPin, Heart, Wallet, Star, LogOut, ShoppingBag } from 'lucide-react';

export default function Account() {
  const { customer, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: customer?.name || '', phone: customer?.phone || '', avatar_url: customer?.avatar_url || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      toast('Profile updated!', 'success');
      setEditing(false);
    } catch (err: any) {
      toast(err.message || apiError(err, 'Update failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!customer) return null;

  const links = [
    { to: '/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/addresses', label: 'Saved Addresses', icon: MapPin },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/loyalty', label: 'Loyalty Points', icon: Star },
    { to: '/spin-win', label: 'Spin & Win', icon: Star },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-2xl font-bold text-neutral-900">My Account</h1>

      {/* Profile card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-100 text-2xl font-black text-brand-600">
            {customer.avatar_url ? <img src={customer.avatar_url} alt={customer.name} className="h-full w-full object-cover" /> : customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-neutral-900">{customer.name}</h2>
            <p className="text-sm text-neutral-500">{customer.email}</p>
            {customer.phone && <p className="text-sm text-neutral-500">{customer.phone}</p>}
          </div>
          <button onClick={() => setEditing(v => !v)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing && (
          <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
            <div>
              <label className="label">Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Avatar URL</label>
              <input value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." className="input" />
            </div>
            <button onClick={handleSave} disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-500">
              <Icon size={18} />
            </div>
            <span className="text-sm font-semibold text-neutral-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-200 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
