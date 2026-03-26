import { Router, Request, Response, NextFunction } from "express";
import { container } from "../../../shared/container/container.js";
import { TYPES } from "../../../shared/container/types.js";
import { SearchTeamsService } from "../application/search-teams.service.js";

export const teamsRouter = Router();

teamsRouter.get(
  "/teams",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTeamsService = container.get<SearchTeamsService>(
        TYPES.SearchTeamsService
      );

      const result = await searchTeamsService.run();

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);
