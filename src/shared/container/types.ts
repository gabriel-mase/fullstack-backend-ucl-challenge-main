export const TYPES = {
  // Matches Context
  MatchRepository: Symbol.for("MatchRepository"),
  SearchMatchesService: Symbol.for("SearchMatchesService"),

  // Draw Context
  DrawRepository: Symbol.for("DrawRepository"),
  CreateDrawService: Symbol.for("CreateDrawService"),
  SearchCurrentDrawService: Symbol.for("SearchCurrentDrawService"),

  // Teams Context
  TeamRepository: Symbol.for("TeamRepository"),
  SearchTeamsService: Symbol.for("SearchTeamsService"),

  // Infrastructure
  PrismaClient: Symbol.for("PrismaClient"),
};
