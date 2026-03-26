import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchRow } from '../MatchRow';
import type { Match } from '@/types';

const makeMatch = (overrides?: Partial<Match>): Match => ({
  id: '1',
  matchDay: 1,
  homeTeam: { id: 10, name: 'Real Madrid', country: { id: 1, name: 'Spain' } },
  awayTeam: { id: 20, name: 'Arsenal', country: { id: 2, name: 'England' } },
  ...overrides,
});

describe('MatchRow', () => {
  it('renders home and away team names', () => {
    render(
      <table>
        <tbody>
          <MatchRow match={makeMatch()} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Real Madrid')).toBeInTheDocument();
    expect(screen.getByText('Arsenal')).toBeInTheDocument();
  });

  it('renders home and away country names', () => {
    render(
      <table>
        <tbody>
          <MatchRow match={makeMatch()} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.getByText('England')).toBeInTheDocument();
  });

  it('renders the vs separator', () => {
    render(
      <table>
        <tbody>
          <MatchRow match={makeMatch()} />
        </tbody>
      </table>
    );
    expect(screen.getByText('vs')).toBeInTheDocument();
  });

  it('highlights the home team when highlightTeamId matches', () => {
    render(
      <table>
        <tbody>
          <MatchRow match={makeMatch()} highlightTeamId={10} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Real Madrid')).toHaveClass('text-blue-700');
    expect(screen.getByText('Arsenal')).not.toHaveClass('text-blue-700');
  });

  it('highlights the away team when highlightTeamId matches', () => {
    render(
      <table>
        <tbody>
          <MatchRow match={makeMatch()} highlightTeamId={20} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Arsenal')).toHaveClass('text-blue-700');
    expect(screen.getByText('Real Madrid')).not.toHaveClass('text-blue-700');
  });

  it('applies no highlight when highlightTeamId does not match any team', () => {
    render(
      <table>
        <tbody>
          <MatchRow match={makeMatch()} highlightTeamId={99} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Real Madrid')).not.toHaveClass('text-blue-700');
    expect(screen.getByText('Arsenal')).not.toHaveClass('text-blue-700');
  });
});
