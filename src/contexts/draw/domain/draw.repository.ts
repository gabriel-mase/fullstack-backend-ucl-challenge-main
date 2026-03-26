import { Draw } from './draw';
import { Team } from './team';

export interface DrawStatistics {
  draw: { id: number; createdAt: Date };
  totalMatches: number;
  matchDays: number;
  matchesPerDay: number;
  totalTeams: number;
  countriesRepresented: number;
  countryDistribution: { country: string; teams: number }[];
}

export interface DrawRepository {
  save(draw: Draw): Promise<void>;
  searchCurrent(): Promise<Draw | null>;
  findAllTeams(): Promise<Team[]>;
  deleteAll(): Promise<void>;
  getStatistics(): Promise<DrawStatistics | null>;
}
