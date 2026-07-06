import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { AdminLayout, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { SpinWinReward } from '../../types';
import { Save, Gift, Plus, Trash2 } from 'lucide-react';

const REWARD_TYPES = [
  { value: 'points', label: 'Loyalty Points' },
  { value: 'wallet', label: 'Wallet Cash' },
  { value: 'coupon', label: 'Coupon Code' },
  { value: 'free_delivery', label: 'Free Delivery' },
  { value: 'none', label: 'No Reward' },
];

const REWARD_COLORS: Record<string, string> = {
  points: 'bg-purple-500',
  wallet: 'bg-green-500',
  coupon: 'bg-blue-500',
  free_delivery: 'bg-amber-500',
  none: 'bg-neutral-400',
};

export default function AdminSpinWin() {
  const toast = useToast();
  const [rewards, setRewards] = useState<SpinWinReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    setLoading(true);
    adminApi.get('/spin-win.php?admin=1')
      .then(({ data }) => setRewards(data.rewards || data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load spin & win config'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const update = (id: number, field: string, value: any) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addSegment = () => {
    const newId = rewards.length > 0 ? Math.max(...rewards.map(r => r.id)) + 1 : 1;
    setRewards(prev => [...prev, {
      id: newId,
      label: 'New Reward',
      reward_type: 'none',
      reward_value: '',
      probability_weight: 1,
      is_active: 1,
    }]);
  };

  const removeSegment = (id: number) => {
    setRewards(prev => prev.filter(r => r.id !== id));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.put('/spin-win.php', { rewards });
      toast('Spin & Win configuration saved', 'success');
      fetch();
    } catch (err) {
      toast(apiError(err, 'Save failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = rewards
    .filter(r => r.is_active)
    .reduce((sum, r) => sum + Number(r.probability_weight || 0), 0);

  const getProbability = (r: SpinWinReward) => {
    if (!r.is_active || totalWeight === 0) return 0;
    return (Number(r.probability_weight) / totalWeight) * 100;
  };

  return (
    <AdminLayout title="Spin & Win">
      <PageHeader title="Spin & Win Rewards" action={
        <div className="flex gap-2">
          <button onClick={addSegment} className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50">
            <Plus size={16} /> Add Segment
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Config'}
          </button>
        </div>
      } />

      {loading ? <Loader /> : rewards.length === 0 ? (
        <EmptyState icon={<Gift size={40} />} title="No reward segments" subtitle="Add segments to configure the spin & win wheel" action={
          <button onClick={addSegment} className="mt-4 flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
            <Plus size={16} /> Add First Segment
          </button>
        } />
      ) : (
        <>
          {/* Wheel preview */}
          <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-neutral-900"><Gift size={18} className="text-brand-500" /> Wheel Preview</h3>
            <div className="flex h-12 overflow-hidden rounded-xl">
              {rewards.filter(r => r.is_active).map(r => {
                const pct = getProbability(r);
                if (pct === 0) return null;
                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-center text-xs font-bold text-white ${REWARD_COLORS[r.reward_type] || 'bg-neutral-400'}`}
                    style={{ width: `${pct}%` }}
                    title={`${r.label}: ${pct.toFixed(1)}%`}
                  >
                    {pct > 8 ? r.label : ''}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-neutral-400">Each segment's width represents its probability of being won.</p>
          </div>

          {/* Segments list */}
          <div className="space-y-3">
            {rewards.map(r => (
              <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 shrink-0 rounded-lg ${REWARD_COLORS[r.reward_type] || 'bg-neutral-400'}`} />
                  <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="label">Label</label>
                      <input value={r.label || ''} onChange={e => update(r.id, 'label', e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Reward Type</label>
                      <select value={r.reward_type || 'none'} onChange={e => update(r.id, 'reward_type', e.target.value)} className="input">
                        {REWARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Reward Value</label>
                      <input value={r.reward_value || ''} onChange={e => update(r.id, 'reward_value', e.target.value)} className="input" placeholder="e.g. 100 or CODE" />
                    </div>
                    <div>
                      <label className="label">Weight</label>
                      <input type="number" step="0.01" value={r.probability_weight || 1} onChange={e => update(r.id, 'probability_weight', e.target.value)} className="input" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-brand-600">{getProbability(r).toFixed(1)}%</span>
                    <span className="text-[10px] text-neutral-400">probability</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                    <input type="checkbox" checked={!!r.is_active} onChange={e => update(r.id, 'is_active', e.target.checked ? 1 : 0)} className="accent-brand-500" />
                    Active
                  </label>
                  <button onClick={() => removeSegment(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm text-neutral-500">
              Total active weight: <span className="font-bold text-neutral-700">{totalWeight}</span>
            </p>
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
