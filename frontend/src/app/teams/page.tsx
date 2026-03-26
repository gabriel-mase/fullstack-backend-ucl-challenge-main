'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/services/api';

export default function TeamsPage() {
  const { data: teams, isLoading, isError } = useQuery({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  });

  return (
    <div className="space-y-6">
      <div className="bg-blue-700 rounded-xl px-6 py-5">
        <h1 className="text-3xl font-bold text-white">Teams</h1>
        <p className="text-blue-200 mt-1">36 clubs participating in the Champions League</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-red-500">Failed to load teams.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {teams?.map(team => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-300 hover:shadow transition-all group"
            >
              <p className="font-semibold text-slate-800 group-hover:text-blue-700 text-sm leading-tight">
                {team.name}
              </p>
              <p className="text-xs text-slate-400 mt-1">{team.country.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
