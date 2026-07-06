import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { money } from '../lib/settings';
import type { LoyaltyEntry } from '../types';
import Loader from '../components/Loader';
import { Award, Star, TrendingUp, Gift, Sparkles, Calendar, ShoppingBag } from 'lucide-react';

const TIERS = [
  { name: 'Bronze', min: 0, color: 'from-amber-600 to-amber-800' },
  { name: 'Silver', min: 500, color: 'from-gray-400 to-gray-600' },
  { name: 'Gold', min: 2000, color: 'from-yellow-400 to-yellow-600' },
  { name: 'Platinum', min: 5000, color: 'from-cyan-400 to-blue-600' },
];

const sourceIcons: Record<string, any> = {
  order: ShoppingBag, referral: Gift, birthday: Calendar, streak: Sparkles, review: Star, spin_win: Sparkles, manual: Award,
};

export default function LoyaltyPage() {
  const toast = useToast();
  const [points, setPoints] = useState(0);
  const [entries, setEntries] = useState<LoyaltyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    api.get('/loyalty.php')
      .then(({ data }) => {
        setPoints(parseInt(data.total_points) || 0);
        setEntries(data.history || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const redeem = async () => {
    if (points < 100) { toast('Need at least 100 points to redeem', 'error'); return; }
    setRedeeming(true);
    try {
      const { data } = await api.post('/loyalty.php', { action: 'redeem', points: Math.floor(points / 100) * 100 });
      if (data?.success) {
        toast(`${money(data.wallet_credit)} added to wallet!`, 'success');
        setPoints(data.remaining_points || 0);
        setEntries(prev => [{ id: Date.now(), customer_id: 0, points: -(data.redeemed_points), type: 'redeem', source: 'manual', description: 'Redeemed to wallet', created_at: new Date().toISOString() }, ...prev]);
      }
    } catch (err) {
      toast(apiError(err, 'Redemption failed'), 'error');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <Loader label="Loading loyalty..." />;

  const currentTier = [...TIERS].reverse().find(t => points >= t.min) || TIERS[0];
  const nextTier = TIERS.find(t => t.min > points);
  const progress = nextTier ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;
  const redeemValue = Math.floor(points / 100) * 10;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-2xl font-bold text-neutral-900">Loyalty Points</h1>

      {/* Points card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentTier.color} p-6 text-white shadow-lg`}>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Award size={20} />
            <span className="text-sm font-semibold text-white/80">{currentTier.name} Member</span>
          </div>
          <p className="mt-3 text-4xl font-black">{points.toLocaleString()}</p>
          <p className="text-sm text-white/80">Loyalty Points</p>
          {nextTier && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-white/70">
                <span>Progress to {nextTier.name}</span>
                <span>{nextTier.min - points} to go</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Redeem */}
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-neutral-900">Redeem Points</p>
            <p className="text-sm text-neutral-500">100 points = {money(10)} wallet credit</p>
          </div>
          <button onClick={redeem} disabled={redeeming || points < 100} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
            {redeeming ? 'Redeeming...' : `Redeem ${money(redeemValue)}`}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: ShoppingBag, title: 'Earn on Orders', desc: '1 point per ₹10 spent' },
          { icon: Gift, title: 'Refer Friends', desc: '50 points per referral' },
          { icon: TrendingUp, title: 'Redeem Points', desc: 'Convert to wallet credit' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-500"><Icon size={18} /></div>
            <div>
              <p className="text-sm font-bold text-neutral-900">{title}</p>
              <p className="text-xs text-neutral-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="mt-5">
        <h3 className="mb-3 font-bold text-neutral-900">Points History</h3>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white py-12 text-center">
            <p className="text-sm text-neutral-400">No points history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(e => {
              const Icon = sourceIcons[e.source] || Award;
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-neutral-100">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${e.type === 'earn' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{e.description || e.source}</p>
                    <p className="text-xs text-neutral-400">{new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <p className={`text-sm font-bold ${e.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                    {e.type === 'earn' ? '+' : ''}{e.points}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
