'use client';

import { FormEvent, useEffect, useState } from 'react';

type BlockedPeriod = {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
};

export default function AvailabilityClient() {
  const [periods, setPeriods] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/availability/me');
      if (!res.ok) {
        throw new Error('Failed to fetch availability');
      }
      const data = (await res.json()) as BlockedPeriod[];
      setPeriods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, reason: reason || undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create blocked period');
      }

      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');

      // Refresh list
      await fetchPeriods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create blocked period');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blocked period?')) {
      return;
    }

    try {
      const res = await fetch(`/api/availability/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete blocked period');
      }

      await fetchPeriods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blocked period');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Add new blocked period form */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Add Blocked Period</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Start Date</span>
              <input
                className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">End Date</span>
              <input
                className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Reason (optional)</span>
            <input
              className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Holiday, Work trip"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Blocked Period'}
          </button>
        </form>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* List of blocked periods */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold">My Blocked Periods</h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-zinc-600">Loading...</div>
        ) : periods.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-zinc-600">
            No blocked periods yet. Add one above to mark when you are unavailable.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {periods.map((period) => (
              <div key={period.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium">
                      {formatDate(period.startDate)} - {formatDate(period.endDate)}
                    </div>
                    {period.reason && (
                      <div className="mt-1 text-sm text-zinc-600">{period.reason}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(period.id)}
                    className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

