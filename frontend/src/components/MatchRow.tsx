import type { Match } from '@/types';

interface Props {
  match: Match;
  highlightTeamId?: number;
}

export function MatchRow({ match, highlightTeamId }: Props) {
  const homeHighlighted = highlightTeamId === match.homeTeam.id;
  const awayHighlighted = highlightTeamId === match.awayTeam.id;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4 text-right">
        <div className={`font-medium ${homeHighlighted ? 'text-blue-700' : 'text-slate-800'}`}>
          {match.homeTeam.name}
        </div>
        <div className="text-xs text-slate-400">{match.homeTeam.country.name}</div>
      </td>
      <td className="py-3 px-4 text-center text-slate-400 text-xs font-medium w-12">vs</td>
      <td className="py-3 px-4">
        <div className={`font-medium ${awayHighlighted ? 'text-blue-700' : 'text-slate-800'}`}>
          {match.awayTeam.name}
        </div>
        <div className="text-xs text-slate-400">{match.awayTeam.country.name}</div>
      </td>
    </tr>
  );
}
