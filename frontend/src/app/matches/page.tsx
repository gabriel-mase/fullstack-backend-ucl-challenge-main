'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import { api } from '@/services/api';
import { MatchRow } from '@/components/MatchRow';
import { Pagination } from '@/components/Pagination';
import type { Match } from '@/types';

const MATCH_DAYS = [1, 2, 3, 4, 5, 6, 7, 8];
const PAGE_SIZE = 20;

function MatchesContent() {
  const router = useRouter();
  const params = useSearchParams();

  const teamId = params.get('teamId') ? Number(params.get('teamId')) : undefined;
  const matchDay = params.get('matchDay') ? Number(params.get('matchDay')) : undefined;
  const side = params.get('side') as 'home' | 'away' | null;
  const page = params.get('page') ? Number(params.get('page')) : 1;

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  });

  // When a team is selected fetch all their matches at once (max 8), else paginate
  const { data, isLoading, isError } = useQuery({
    queryKey: ['matches', { teamId, matchDay, side, page }],
    queryFn: () =>
      api.getMatches({
        teamId,
        matchDay,
        page: teamId ? 1 : page,
        limit: teamId ? 100 : PAGE_SIZE,
      }),
  });

  const matches: Match[] = useMemo(() => {
    if (!data) return [];
    let result = data.matches;
    if (teamId && side === 'home') result = result.filter(m => m.homeTeam.id === teamId);
    if (teamId && side === 'away') result = result.filter(m => m.awayTeam.id === teamId);
    return result;
  }, [data, teamId, side]);

  const matchesByDay = useMemo(() => {
    const grouped = new Map<number, Match[]>();
    for (const match of matches) {
      const group = grouped.get(match.matchDay) ?? [];
      group.push(match);
      grouped.set(match.matchDay, group);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [matches]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // Reset page on filter change
    if (key !== 'page') next.delete('page');
    router.push(`/matches?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-700 rounded-xl px-6 py-5">
        <h1 className="text-3xl font-bold text-white">Match Schedule</h1>
        <p className="text-blue-200 mt-1">144 matches across 8 match days</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4">
        {/* Team filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Team</label>
          <select
            value={teamId ?? ''}
            onChange={e => setParam('teamId', e.target.value || null)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          >
            <option value="">All teams</option>
            {teams?.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Match day filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Match Day</label>
          <div className="flex gap-1">
            <button
              onClick={() => setParam('matchDay', null)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                !matchDay
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {MATCH_DAYS.map(d => (
              <button
                key={d}
                onClick={() => setParam('matchDay', matchDay === d ? null : String(d))}
                className={`w-9 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  matchDay === d
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Home/Away filter — only when a team is selected */}
        {teamId && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Side</label>
            <div className="flex gap-1">
              {(['all', 'home', 'away'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setParam('side', s === 'all' ? null : s)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border capitalize transition-colors ${
                    (s === 'all' && !side) || side === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading matches…</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load matches.</div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No matches found.</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {teamId ? `${matches.length} matches` : `${data?.pagination.total ?? 0} matches total`}
              </span>
            </div>
            <table className="w-full">
              <colgroup>
                <col className="w-5/12" />
                <col className="w-12" />
                <col className="w-5/12" />
              </colgroup>
              <tbody>
                {matchesByDay.map(([day, dayMatches]) => (
                  <React.Fragment key={`day-${day}`}>
                    <tr className="bg-slate-50 border-y border-slate-200">
                      <td colSpan={3} className="px-4 py-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Match Day {day}
                        </span>
                      </td>
                    </tr>
                    <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                      <th className="py-2 px-4 text-right font-semibold">Home</th>
                      <th className="py-2 px-4 w-12" />
                      <th className="py-2 px-4 text-left font-semibold">Away</th>
                    </tr>
                    {dayMatches.map(match => (
                      <MatchRow key={match.id} match={match} highlightTeamId={teamId} />
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {!teamId && data && (
              <Pagination
                page={page}
                totalPages={data.pagination.totalPages}
                onPageChange={p => setParam('page', String(p))}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
      <MatchesContent />
    </Suspense>
  );
}
