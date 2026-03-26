import type { Draw, Match, MatchesResponse, MatchFilters, Team } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getTeams: (): Promise<Team[]> =>
    request('/teams'),

  getMatches: (filters: MatchFilters = {}): Promise<MatchesResponse> => {
    const params = new URLSearchParams();
    if (filters.teamId != null) params.set('teamId', String(filters.teamId));
    if (filters.matchDay != null) params.set('matchDay', String(filters.matchDay));
    if (filters.page != null) params.set('page', String(filters.page));
    if (filters.limit != null) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request(`/matches${qs ? `?${qs}` : ''}`);
  },

  getDraw: async (): Promise<Draw | null> => {
    const res = await fetch(`${API_URL}/draw`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json() as Promise<Draw>;
  },

  createDraw: (): Promise<{ message: string }> =>
    request('/draw', { method: 'POST' }),

  deleteDraw: (): Promise<{ message: string }> =>
    request('/draw', { method: 'DELETE' }),
};
