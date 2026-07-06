import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { AdminLayout, Badge, PageHeader } from '../../components/admin/AdminLayout';
import Loader from '../../components/Loader';
import { EmptyState } from '../../components/Loader';
import type { Review } from '../../types';
import { Star, Check, X } from 'lucide-react';

type FilterTab = 'pending' | 'approved' | 'all';

export default function AdminReviews() {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('pending');
  const [updating, setUpdating] = useState<number | null>(null);

  const fetch = () => {
    setLoading(true);
    adminApi.get('/reviews.php?per_page=100')
      .then(({ data }) => setReviews(data.data || []))
      .catch(() => toast(apiError(null, 'Failed to load reviews'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const decide = async (r: Review, decision: 'approve' | 'reject') => {
    setUpdating(r.id);
    try {
      await adminApi.put('/reviews.php', { id: r.id, decision });
      toast(`Review ${decision === 'approve' ? 'approved' : 'rejected'}`, 'success');
      setReviews(prev => prev.map(rv => rv.id === r.id ? { ...rv, is_approved: decision === 'approve' ? 1 : 2 } : rv));
    } catch (err) {
      toast(apiError(err, 'Update failed'), 'error');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = reviews.filter(r => {
    if (tab === 'pending') return r.is_approved === 0;
    if (tab === 'approved') return r.is_approved === 1;
    return true;
  });

  const pendingCount = reviews.filter(r => r.is_approved === 0).length;
  const approvedCount = reviews.filter(r => r.is_approved === 1).length;

  return (
    <AdminLayout title="Reviews">
      <PageHeader title="Review Moderation" />

      <div className="mb-4 flex gap-2">
        {([
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'approved', label: `Approved (${approvedCount})` },
          { key: 'all', label: `All (${reviews.length})` },
        ] as { key: FilterTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === key ? 'bg-brand-500 text-white' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : filtered.length === 0 ? (
        <EmptyState icon={<Star size={40} />} title="No reviews found" subtitle="Reviews will appear here for moderation" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase text-neutral-400">
                <th className="p-3">Product</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Comment</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-3 font-medium text-neutral-700">{r.product_name || `#${r.product_id}`}</td>
                  <td className="p-3 text-neutral-500">{r.customer_name || `Customer #${r.customer_id}`}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={13} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'} />
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-neutral-500 max-w-xs truncate">{r.comment || '—'}</td>
                  <td className="p-3">
                    {r.is_approved === 1 ? <Badge status="approved">Approved</Badge> :
                     r.is_approved === 2 ? <Badge status="rejected">Rejected</Badge> :
                     <Badge status="pending">Pending</Badge>}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => decide(r, 'approve')}
                        disabled={updating === r.id}
                        className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-100 disabled:opacity-50"
                      >
                        <Check size={13} /> Approve
                      </button>
                      <button
                        onClick={() => decide(r, 'reject')}
                        disabled={updating === r.id}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <X size={13} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
