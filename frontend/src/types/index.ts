export interface Country {
  id: number;
  name: string;
}

export interface Team {
  id: number;
  name: string;
  country: Country;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  matchDay: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MatchesResponse {
  matches: Match[];
  pagination: Pagination;
}

export interface Draw {
  id: number;
  createdAt: string;
}

export interface MatchFilters {
  teamId?: number;
  matchDay?: number;
  page?: number;
  limit?: number;
}
