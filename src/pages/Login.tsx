import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { apiError } from '../lib/api';
import { User, Mail, Phone, Lock, Eye, EyeOff, UtensilsCrossed } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { customer, login, register } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const redirect = params.get('redirect') || '/account';

  useEffect(() => {
    if (customer) navigate(redirect);
  }, [customer, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast('Welcome back!', 'success');
      } else {
        if (!form.name || !form.phone) throw new Error('Name and phone are required');
        await register(form.name, form.email, form.phone, form.password);
        toast('Account created!', 'success');
      }
      navigate(redirect);
    } catch (err: any) {
      toast(err.message || apiError(err, 'Authentication failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl items-center px-4 py-10 sm:px-6">
      <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-neutral-100 md:grid-cols-2">
        {/* Branding */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-500 to-brand-600 p-8 md:flex">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl font-black text-white">Z</div>
            <h2 className="mt-6 text-2xl font-black text-white">Zaika Lounge</h2>
            <p className="mt-1 text-sm text-white/80">Authentic Flavours, Modern Comfort.</p>
          </div>
          <div className="mt-8 space-y-3">
            {['Order food online', 'Earn loyalty points', 'Get exclusive deals', 'Spin & Win rewards'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/90">
                <div className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-xs">✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex gap-2 rounded-xl bg-neutral-100 p-1">
            <button onClick={() => setMode('login')} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500'}`}>Sign In</button>
            <button onClick={() => setMode('register')} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${mode === 'register' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500'}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="input pl-10" />
                </div>
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="input pl-10" />
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="input pl-10" />
                </div>
              </div>
            )}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <Link to="/forgot-password" className="mt-4 block text-center text-sm font-semibold text-brand-500 hover:text-brand-700">Forgot password?</Link>
          )}
          <p className="mt-4 text-center text-xs text-neutral-400">
            Admin? <Link to="/admin/login" className="font-semibold text-neutral-600 hover:text-brand-500">Admin Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
