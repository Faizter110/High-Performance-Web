import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tournamentsTable } from "@workspace/db/schema";
import { CreateTournamentBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const tournaments = await db.select().from(tournamentsTable);
  res.json(tournaments);
});

router.post("/", async (req, res) => {
  const body = CreateTournamentBody.parse(req.body);
  const [created] = await db.insert(tournamentsTable).values(body).returning();
  res.status(201).json(created);
});

export default router;
