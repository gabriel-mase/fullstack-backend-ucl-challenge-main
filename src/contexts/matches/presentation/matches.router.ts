import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { container } from "../../../shared/container/container.js";
import { TYPES } from "../../../shared/container/types.js";
import { SearchMatchesService } from "../application/search-matches.service.js";
import { MatchRepository } from "../domain/match.repository.js";
import { SearchMatchesResponse } from "./dtos/match-response.dto.js";
import { SearchMatchesQuerySchema } from "./dtos/search-matches.dto.js";

export const matchesRouter = Router();

matchesRouter.get(
  "/matches",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = SearchMatchesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const { teamId, matchDay, page, limit } = parsed.data;

      const searchMatchesService = container.get<SearchMatchesService>(
        TYPES.SearchMatchesService
      );

      const result: SearchMatchesResponse = await searchMatchesService.run({
        teamId,
        matchDay,
        page,
        limit,
      });

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);

const MatchIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: "Match ID must be greater than 0" }),
});

matchesRouter.get(
  "/matches/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = MatchIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const matchRepository = container.get<MatchRepository>(TYPES.MatchRepository);
      const match = await matchRepository.findById(parsed.data.id);

      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      return res.status(200).json(match.toPrimitives());
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);
