import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { matchesTable, gameStatesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateMatchBody,
  UpdateMatchBody,
  AwardBlockBody,
} from "@workspace/api-zod";
import {
  initBlocks,
  computeMatchPoints,
  checkWinner,
  type Block,
} from "../lib/pathfinding.js";
import { getIO } from "../lib/socketManager.js";
import { buildStatePayload, getOrCreateGameState } from "../lib/socketManager.js";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { tournamentId, status } = req.query;
  let matches = await db.select().from(matchesTable);
  if (tournamentId) {
    matches = matches.filter((m) => m.tournamentId === parseInt(tournamentId as string));
  }
  if (status) {
    matches = matches.filter((m) => m.status === status);
  }
  res.json(matches);
});

router.post("/", async (req, res) => {
  const body = CreateMatchBody.parse(req.body);
  const [created] = await db.insert(matchesTable).values(body).returning();
  res.status(201).json(created);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, id));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  res.json(match);
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateMatchBody.parse(req.body);
  const [updated] = await db
    .update(matchesTable)
    .set(body)
    .where(eq(matchesTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  res.json(updated);
});

router.get("/:id/state", async (req, res) => {
  const matchId = parseInt(req.params.id);
  try {
    const payload = await buildStatePayload(matchId);
    res.json(payload);
  } catch (err) {
    res.status(404).json({ error: "Match not found" });
  }
});

router.post("/:id/blocks", async (req, res) => {
  const matchId = parseInt(req.params.id);
  const body = AwardBlockBody.parse(req.body);

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const size = match.boardSize === "3x3" ? 3 : 5;
  const state = await getOrCreateGameState(matchId);
  const blocks = (state.blocks as Block[]) || initBlocks(size);

  const updatedBlocks = blocks.map((b) =>
    b.index === body.blockIndex
      ? { ...b, owner: body.team as "red" | "blue", questionId: body.questionId ?? null }
      : b
  );
  const withMatchPoints = computeMatchPoints(updatedBlocks, size);

  await db
    .update(gameStatesTable)
    .set({ blocks: withMatchPoints as any, currentBlockIndex: null, currentQuestionId: null, buzzerStatus: null })
    .where(eq(gameStatesTable.matchId, matchId));

  const winner = checkWinner(withMatchPoints, size);
  if (winner) {
    await db
      .update(matchesTable)
      .set({ status: "Completed", winnerTeam: winner })
      .where(eq(matchesTable.id, matchId));
  }

  try {
    const io = getIO();
    const payload = await buildStatePayload(matchId);
    io.to(`match:${matchId}`).emit("gameState", payload);
    if (winner) {
      io.to(`match:${matchId}`).emit("matchComplete", {
        winner,
        teamName: winner === "red" ? match.redTeamName : match.blueTeamName,
      });
    }
  } catch (_) {}

  const payload = await buildStatePayload(matchId);
  res.json(payload);
});

router.post("/:id/reset", async (req, res) => {
  const matchId = parseInt(req.params.id);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const size = match.boardSize === "3x3" ? 3 : 5;
  const blocks = initBlocks(size);

  await db
    .update(gameStatesTable)
    .set({ blocks: blocks as any, currentBlockIndex: null, currentQuestionId: null, buzzerStatus: null })
    .where(eq(gameStatesTable.matchId, matchId));

  await db
    .update(matchesTable)
    .set({ status: "In Progress", winnerTeam: null })
    .where(eq(matchesTable.id, matchId));

  try {
    const io = getIO();
    const payload = await buildStatePayload(matchId);
    io.to(`match:${matchId}`).emit("gameState", payload);
  } catch (_) {}

  const payload = await buildStatePayload(matchId);
  res.json(payload);
});

export default router;
