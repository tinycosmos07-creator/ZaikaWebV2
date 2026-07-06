import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth.php?action=forgot_password', { email });
      if (data?.success) {
        toast('Reset code sent to your email', 'success');
        setStep(2);
      } else throw new Error(data?.message);
    } catch (err: any) {
      toast(err.message || apiError(err, 'Failed to send code'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) { toast('Passwords do not match', 'error'); return; }
    if (newPass.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth.php?action=reset_password', { email, token: otp, password: newPass });
      if (data?.success) {
        toast('Password reset successfully!', 'success');
        setStep(4);
      } else throw new Error(data?.message);
    } catch (err: any) {
      toast(err.message || apiError(err, 'Reset failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md items-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-3xl bg-white p-8 shadow-xl ring-1 ring-neutral-100">
        <Link to="/login" className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-brand-500">
          <ArrowLeft size={16} /> Back to login
        </Link>

        {step === 1 && (
          <>
            <h1 className="text-xl font-bold text-neutral-900">Forgot Password</h1>
            <p className="mt-1 text-sm text-neutral-500">Enter your email to receive a reset code.</p>
            <form onSubmit={requestReset} className="mt-5 space-y-3">
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input pl-10" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-xl font-bold text-neutral-900">Verify Code</h1>
            <p className="mt-1 text-sm text-neutral-500">Enter the 6-digit code sent to {email}.</p>
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="mt-5 space-y-3">
              <input required value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter code" maxLength={6} className="input text-center text-lg tracking-widest" />
              <button type="submit" className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600">Verify</button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-xl font-bold text-neutral-900">New Password</h1>
            <p className="mt-1 text-sm text-neutral-500">Choose a new password for your account.</p>
            <form onSubmit={resetPassword} className="mt-5 space-y-3">
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type={showPass ? 'text' : 'password'} required value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input type={showPass ? 'text' : 'password'} required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm password" className="input" />
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <h1 className="mt-3 text-xl font-bold text-neutral-900">Password Reset!</h1>
            <p className="mt-1 text-sm text-neutral-500">Your password has been reset successfully.</p>
            <button onClick={() => navigate('/login')} className="mt-5 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
