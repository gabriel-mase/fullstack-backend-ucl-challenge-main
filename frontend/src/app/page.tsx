'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/services/api';

export default function HomePage() {
  const qc = useQueryClient();

  const { data: draw, isLoading } = useQuery({
    queryKey: ['draw'],
    queryFn: api.getDraw,
  });

  const createMutation = useMutation({
    mutationFn: api.createDraw,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['draw'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteDraw,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['draw'] }),
  });

  const isBusy = createMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="bg-blue-700 rounded-xl px-6 py-5">
        <h1 className="text-3xl font-bold text-white">Champions League Draw</h1>
        <p className="text-blue-200 mt-1">36 teams · 144 matches · 8 match days</p>
      </div>

      {/* Draw status */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Draw Status</h2>

        {isLoading ? (
          <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        ) : draw ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="font-semibold text-slate-800">Draw completed</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Created on {new Date(draw.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={isBusy}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {deleteMutation.isPending ? 'Resetting…' : 'Reset Draw'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="font-semibold text-slate-500">No draw yet</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">Run the draw to generate the match schedule</p>
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={isBusy}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Drawing…' : 'Run Draw'}
            </button>
          </div>
        )}

        {(createMutation.isError || deleteMutation.isError) && (
          <p className="mt-3 text-sm text-red-500">
            {(createMutation.error || deleteMutation.error)?.message}
          </p>
        )}
      </div>

      {/* Quick navigation */}
      {draw && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/matches"
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-blue-300 hover:shadow transition-all group"
          >
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-700">Match Schedule</h3>
            <p className="text-sm text-slate-400 mt-1">Browse all 144 matches, filter by team or match day</p>
          </Link>
          <Link
            href="/teams"
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-blue-300 hover:shadow transition-all group"
          >
            <div className="text-2xl mb-2">🏟️</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-700">Teams</h3>
            <p className="text-sm text-slate-400 mt-1">View all 36 participating teams and their schedules</p>
          </Link>
        </div>
      )}
    </div>
  );
}
