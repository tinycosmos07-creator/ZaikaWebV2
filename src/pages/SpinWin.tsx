import { useEffect, useState, useRef } from 'react';
import { api, apiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import type { SpinWinReward } from '../types';
import Loader from '../components/Loader';
import { Gift, Sparkles, Trophy, Info } from 'lucide-react';

export default function SpinWin() {
  const { customer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<SpinWinReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinWinReward | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const wheelRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    api.get('/spin-win.php')
      .then(({ data }) => {
        setRewards(data.rewards || []);
        setCanSpin(data.can_spin !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const spin = async () => {
    if (!customer) { toast('Please sign in to play', 'info'); navigate('/login?redirect=/spin-win'); return; }
    if (!canSpin || spinning) return;

    setSpinning(true);
    setResult(null);
    try {
      const { data } = await api.post('/spin-win.php');
      if (data?.success && data.reward) {
        const reward = data.reward;
        const winIdx = rewards.findIndex(r => r.id === reward.id);
        if (winIdx >= 0) {
          const segAngle = 360 / rewards.length;
          const targetAngle = 360 * 5 + (360 - (winIdx * segAngle + segAngle / 2));
          setRotation(prev => prev + targetAngle);
          setTimeout(() => {
            setResult(reward);
            setSpinning(false);
            setCanSpin(false);
            if (reward.reward_type !== 'none') {
              toast(`You won ${reward.label}!`, 'success');
            } else {
              toast('Better luck next time!', 'info');
            }
          }, 4000);
        }
      } else {
        toast(data?.message || 'Spin failed', 'error');
        setSpinning(false);
      }
    } catch (err) {
      toast(apiError(err, 'Spin failed'), 'error');
      setSpinning(false);
    }
  };

  if (loading) return <Loader label="Loading Spin & Win..." />;

  const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const segCount = rewards.length || 6;
  const segAngle = 360 / segCount;
  const radius = 140;
  const cx = 150, cy = 150;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg">
          <Gift size={28} />
        </div>
        <h1 className="mt-3 text-2xl font-black text-neutral-900">Spin & Win</h1>
        <p className="mt-1 text-sm text-neutral-500">Spin the wheel daily for exciting rewards!</p>
      </div>

      {/* Wheel */}
      <div className="mt-8 flex flex-col items-center">
        <div className="relative">
          <svg
            ref={wheelRef}
            width="300"
            height="300"
            viewBox="0 0 300 300"
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none' }}
          >
            {rewards.length > 0 ? rewards.map((r, i) => {
              const startAngle = (i * segAngle - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180);
              const x1 = cx + radius * Math.cos(startAngle);
              const y1 = cy + radius * Math.sin(startAngle);
              const x2 = cx + radius * Math.cos(endAngle);
              const y2 = cy + radius * Math.sin(endAngle);
              const largeArc = segAngle > 180 ? 1 : 0;
              const midAngle = (startAngle + endAngle) / 2;
              const tx = cx + (radius * 0.6) * Math.cos(midAngle);
              const ty = cy + (radius * 0.6) * Math.sin(midAngle);
              return (
                <g key={r.id}>
                  <path
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={colors[i % colors.length]}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={tx} y={ty}
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    transform={`rotate(${i * segAngle + segAngle / 2}, ${tx}, ${ty})`}
                  >
                    {r.label.length > 12 ? r.label.slice(0, 10) + '..' : r.label}
                  </text>
                </g>
              );
            }) : (
              <circle cx={cx} cy={cy} r={radius} fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />
            )}
            <circle cx={cx} cy={cy} r="20" fill="white" stroke="#d1d5db" strokeWidth="2" />
          </svg>
          {/* Pointer */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1">
            <div className="h-0 w-0 border-x-[10px] border-x-transparent border-t-[16px] border-t-neutral-900" />
          </div>
        </div>

        <button
          onClick={spin}
          disabled={spinning || !canSpin}
          className="mt-6 rounded-2xl bg-brand-500 px-10 py-3.5 text-base font-black text-white shadow-lg transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {spinning ? 'Spinning...' : canSpin ? 'SPIN NOW' : 'Come Back Tomorrow'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-50 to-amber-50 p-6 text-center ring-1 ring-brand-100">
          <Trophy size={32} className="mx-auto text-amber-500" />
          <p className="mt-2 text-lg font-black text-neutral-900">
            {result.reward_type === 'none' ? 'Better Luck Next Time!' : `You won ${result.label}!`}
          </p>
          {result.reward_type !== 'none' && result.reward_value && (
            <p className="mt-1 text-sm text-neutral-600">Reward: {result.reward_value}</p>
          )}
        </div>
      )}

      {/* Rules */}
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-neutral-900"><Info size={18} className="text-brand-500" /> How It Works</h3>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li className="flex items-start gap-2"><Sparkles size={14} className="mt-0.5 text-brand-500" /> One free spin per day</li>
          <li className="flex items-start gap-2"><Sparkles size={14} className="mt-0.5 text-brand-500" /> Win wallet credit, loyalty points, or free delivery</li>
          <li className="flex items-start gap-2"><Sparkles size={14} className="mt-0.5 text-brand-500" /> Rewards are automatically credited to your account</li>
        </ul>
      </div>
    </div>
  );
}
