import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { money } from '../lib/settings';
import type { WalletTransaction } from '../types';
import Loader from '../components/Loader';
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, Gift, RotateCcw, ShoppingBag, Award, Calendar, Sparkles } from 'lucide-react';

const sourceIcons: Record<string, any> = {
  referral: Gift, refund: RotateCcw, order: ShoppingBag, loyalty: Award, birthday: Calendar, streak: Sparkles, spin_win: Sparkles, manual: Wallet,
};

export default function WalletPage() {
  const toast = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/wallet.php');
      setBalance(parseFloat(data.balance) || 0);
      setTransactions(data.transactions || []);
    } catch (err) {
      toast(apiError(err, 'Failed to load wallet'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const refresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <Loader label="Loading wallet..." />;

  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + parseFloat(String(t.amount)), 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + parseFloat(String(t.amount)), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-2xl font-bold text-neutral-900">My Wallet</h1>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-4 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={20} />
              <span className="text-sm font-semibold text-white/80">Wallet Balance</span>
            </div>
            <button onClick={refresh} disabled={refreshing} className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 hover:bg-white/30">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="mt-3 text-4xl font-black">{money(balance)}</p>
          <div className="mt-4 flex gap-4">
            <div>
              <p className="text-xs text-white/60">Total Credited</p>
              <p className="text-sm font-bold">{money(totalCredit)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Total Debited</p>
              <p className="text-sm font-bold">{money(totalDebit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="mt-5">
        <h3 className="mb-3 font-bold text-neutral-900">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white py-12 text-center">
            <p className="text-sm text-neutral-400">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(t => {
              const Icon = sourceIcons[t.source] || Wallet;
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-neutral-100">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${t.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{t.description || t.source}</p>
                    <p className="text-xs text-neutral-400">{new Date(t.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'credit' ? '+' : '-'}{money(t.amount)}
                    </p>
                    <p className="text-xs text-neutral-400">Bal: {money(t.balance_after)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
