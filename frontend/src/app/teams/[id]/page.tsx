'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { MatchRow } from '@/components/MatchRow';
import type { Match } from '@/types';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['matches', { teamId }],
    queryFn: () => api.getMatches({ teamId, limit: 100 }),
    enabled: !isNaN(teamId),
  });

  const team = teams?.find(t => t.id === teamId);
  const matches = data?.matches ?? [];

  const homeCount = matches.filter(m => m.homeTeam.id === teamId).length;
  const awayCount = matches.filter(m => m.awayTeam.id === teamId).length;

  const matchesByDay: [number, Match[]][] = Object.entries(
    [...matches]
      .sort((a, b) => a.matchDay - b.matchDay)
      .reduce<Record<number, Match[]>>((acc, m) => {
        (acc[m.matchDay] ??= []).push(m);
        return acc;
      }, {})
  ).map(([day, ms]) => [Number(day), ms]);

  return (
    <div className="space-y-6">
      <Link href="/teams" className="text-sm text-blue-600 hover:underline">
        ← Back to Teams
      </Link>

      {/* Team header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {team ? (
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
              <p className="text-slate-500 mt-1">{team.country.name}</p>
            </div>
            {matches.length > 0 && (
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-slate-800">{matches.length}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Matches</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{homeCount}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Home</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-600">{awayCount}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Away</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-12 w-48 bg-slate-100 rounded animate-pulse" />
        )}
      </div>

      {/* Match schedule */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Match Schedule</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading matches…</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load matches.</div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No draw has been run yet.</div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
