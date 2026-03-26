import { injectable, inject } from "inversify";
import { TYPES } from "../../../shared/container/types.js";
import { TeamRepository } from "../../draw/domain/team.repository.js";
import { TeamPrimitives } from "../../draw/domain/team.js";

@injectable()
export class SearchTeamsService {
  constructor(
    @inject(TYPES.TeamRepository)
    private readonly teamRepository: TeamRepository
  ) {}

  async run(): Promise<TeamPrimitives[]> {
    const teams = await this.teamRepository.findAll();
    return teams.map((t) => t.toPrimitives());
  }
}
