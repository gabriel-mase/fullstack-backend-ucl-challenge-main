import { injectable } from "inversify";
import { PrismaRepository } from "../../../shared/infrastructure/prisma.repository.js";
import { Draw } from "../domain/draw.js";
import { DrawRepository, DrawStatistics } from "../domain/draw.repository.js";
import { Team } from "../domain/team.js";
import { Country } from "../domain/country.js";

@injectable()
export class PrismaDrawRepository
  extends PrismaRepository<"Draw">
  implements DrawRepository
{
  protected modelName = "Draw" as const;

  public async save(draw: Draw): Promise<void> {
    const primitives = draw.toPrimitives();

    const teamPotAssignments: Array<{ teamId: number; potId: number }> = [];
    for (const pot of primitives.pots) {
      for (const team of pot.teams) {
        teamPotAssignments.push({
          teamId: team.id,
          potId: pot.id,
        });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const savedDraw = await tx.draw.upsert({
        where: { id: primitives.id ?? 0 },
        create: {
          createdAt: primitives.createdAt,
          drawTeamPots: {
            create: teamPotAssignments,
          },
        },
        update: {
          createdAt: primitives.createdAt,
          drawTeamPots: {
            deleteMany: {},
            create: teamPotAssignments,
          },
        },
      });

      await tx.match.deleteMany({
        where: { drawId: savedDraw.id },
      });

      if (primitives.matches.length > 0) {
        await tx.match.createMany({
          data: primitives.matches.map((match) => ({
            drawId: savedDraw.id,
            homeTeamId: match.homeTeam.id,
            awayTeamId: match.awayTeam.id,
            matchDay: match.matchDay,
          })),
        });
      }
    });
  }

  public async searchCurrent(): Promise<Draw | null> {
    const drawRecord = await this.model.findFirst({
      include: {
        drawTeamPots: {
          include: {
            team: {
              include: {
                country: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!drawRecord) {
      return null;
    }

    const teams = await this.prisma.team.findMany({
      include: {
        country: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const teamMap = new Map<number, any>();
    for (const team of teams) {
      teamMap.set(team.id, team);
    }

    const matches = await this.prisma.match.findMany({
      where: {
        drawId: drawRecord.id,
      },
    });

    const pots: Array<{
      id: number;
      teams: Array<{
        id: number;
        name: string;
        country: { id: number; name: string };
      }>;
    }> = [];

    for (let potId = 1; potId <= 4; potId++) {
      const teamsInPot = drawRecord.drawTeamPots
        .filter((dtp: any) => dtp.potId === potId)
        .map((dtp: any) => {
          const team = teamMap.get(dtp.teamId);
          if (!team || !team.country) {
            throw new Error(
              `Team ${dtp.teamId} not found or has no country`
            );
          }
          return {
            id: team.id,
            name: team.name,
            country: {
              id: team.country.id,
              name: team.country.name,
            },
          };
        });

      pots.push({
        id: potId,
        teams: teamsInPot,
      });
    }

    return Draw.fromPrimitives({
      id: drawRecord.id,
      createdAt: drawRecord.createdAt,
      pots,
      matches: matches.map((match: any) => {
        const homeTeam = teamMap.get(match.homeTeamId);
        const awayTeam = teamMap.get(match.awayTeamId);

        if (!homeTeam || !homeTeam.country) {
          throw new Error(
            `Home team ${match.homeTeamId} not found or has no country`
          );
        }
        if (!awayTeam || !awayTeam.country) {
          throw new Error(
            `Away team ${match.awayTeamId} not found or has no country`
          );
        }

        return {
          id: match.id,
          drawId: match.drawId,
          homeTeam: {
            id: homeTeam.id,
            name: homeTeam.name,
            country: {
              id: homeTeam.country.id,
              name: homeTeam.country.name,
            },
          },
          awayTeam: {
            id: awayTeam.id,
            name: awayTeam.name,
            country: {
              id: awayTeam.country.id,
              name: awayTeam.country.name,
            },
          },
          matchDay: match.matchDay,
        };
      }),
    });
  }

  public async findAllTeams(): Promise<Team[]> {
    const teams = await this.prisma.team.findMany({
      include: {
        country: true,
      },
      orderBy: {
        id: "asc",
      },
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

  public async deleteAll(): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.match.deleteMany();
      await tx.drawTeamPot.deleteMany();
      await tx.draw.deleteMany();
    });
  }

  public async getStatistics(): Promise<DrawStatistics | null> {
    const draw = await this.prisma.draw.findFirst({ orderBy: { createdAt: "desc" } });
    if (!draw) return null;

    const [totalMatches, teams] = await Promise.all([
      this.prisma.match.count({ where: { drawId: draw.id } }),
      this.prisma.team.findMany({ include: { country: true } }),
    ]);

    const countryMap = new Map<string, number>();
    for (const team of teams) {
      if (!team.country) continue;
      const name = team.country.name;
      countryMap.set(name, (countryMap.get(name) ?? 0) + 1);
    }

    const countryDistribution = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, teams: count }))
      .sort((a, b) => b.teams - a.teams);

    const matchDays = 8;

    return {
      draw: { id: draw.id, createdAt: draw.createdAt },
      totalMatches,
      matchDays,
      matchesPerDay: totalMatches / matchDays,
      totalTeams: teams.length,
      countriesRepresented: countryMap.size,
      countryDistribution,
    };
  }
}
