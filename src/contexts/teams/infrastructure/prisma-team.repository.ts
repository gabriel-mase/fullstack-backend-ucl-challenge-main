import { injectable } from "inversify";
import { PrismaRepository } from "../../../shared/infrastructure/prisma.repository.js";
import { Team } from "../../draw/domain/team.js";
import { Country } from "../../draw/domain/country.js";
import { TeamRepository } from "../../draw/domain/team.repository.js";

@injectable()
export class PrismaTeamRepository
  extends PrismaRepository<"Team">
  implements TeamRepository
{
  protected modelName = "Team" as const;

  public async findAll(): Promise<Team[]> {
    const teams = await this.prisma.team.findMany({
      include: { country: true },
      orderBy: { id: "asc" },
    });

    return teams.map((team: any) => {
      if (!team.country) {
        throw new Error(`Team ${team.id} has no country`);
      }
      return Team.create(
        team.id,
        team.name,
        Country.create(team.country.id, team.country.name)
      );
    });
  }
}
