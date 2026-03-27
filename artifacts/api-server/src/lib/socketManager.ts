import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { db } from "@workspace/db";
import { matchesTable, gameStatesTable, questionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  initBlocks,
  computeMatchPoints,
  checkWinner,
  bfsDistance,
  type Block,
} from "./pathfinding.js";
import { logger } from "./logger.js";

let io: SocketServer | null = null;

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

async function getOrCreateGameState(matchId: number) {
  const [existing] = await db
    .select()
    .from(gameStatesTable)
    .where(eq(gameStatesTable.matchId, matchId));
  if (existing) return existing;

  const [match] = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.id, matchId));
  if (!match) throw new Error("Match not found");

  const size = match.boardSize === "3x3" ? 3 : 5;
  const blocks = initBlocks(size);

  const [created] = await db
    .insert(gameStatesTable)
    .values({ matchId, blocks: blocks as any })
    .returning();
  return created;
}

async function buildStatePayload(matchId: number) {
  const [match] = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.id, matchId));
  if (!match) throw new Error("Match not found");

  const state = await getOrCreateGameState(matchId);
  const size = match.boardSize === "3x3" ? 3 : 5;
  const blocks = state.blocks as Block[];

  let currentQuestion = null;
  if (state.currentQuestionId) {
    const [q] = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, state.currentQuestionId));
    currentQuestion = q || null;
  }

  return {
    matchId,
    blocks,
    boardSize: match.boardSize,
    redTeamName: match.redTeamName,
    blueTeamName: match.blueTeamName,
    status: match.status,
    winnerTeam: match.winnerTeam,
    buzzerStatus: state.buzzerStatus,
    currentBlockIndex: state.currentBlockIndex,
    currentQuestion,
    redBlocksAway: bfsDistance(blocks, "red", size),
    blueBlocksAway: bfsDistance(blocks, "blue", size),
  };
}

export function initSocketIO(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: "*" },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("joinMatch", async (matchId: number) => {
      socket.join(`match:${matchId}`);
      try {
        const payload = await buildStatePayload(matchId);
        socket.emit("gameState", payload);
      } catch (err) {
        logger.error({ err }, "Error building state payload");
      }
    });

    socket.on("leaveMatch", (matchId: number) => {
      socket.leave(`match:${matchId}`);
    });

    socket.on("openBlock", async ({ matchId, blockIndex }: { matchId: number; blockIndex: number }) => {
      try {
        const questions = await db
          .select()
          .from(questionsTable)
          .where(eq(questionsTable.isActive, true));
        const randomQ = questions[Math.floor(Math.random() * questions.length)] || null;
        const qId = randomQ?.id ?? null;

        await db
          .update(gameStatesTable)
          .set({ currentBlockIndex: blockIndex, currentQuestionId: qId, buzzerStatus: null })
          .where(eq(gameStatesTable.matchId, matchId));

        const payload = await buildStatePayload(matchId);
        io!.to(`match:${matchId}`).emit("gameState", payload);
        io!.to(`match:${matchId}`).emit("blockOpened", { blockIndex, question: randomQ });
      } catch (err) {
        logger.error({ err }, "Error opening block");
      }
    });

    socket.on("buzz", async ({ matchId, team }: { matchId: number; team: string }) => {
      try {
        const [state] = await db
          .select()
          .from(gameStatesTable)
          .where(eq(gameStatesTable.matchId, matchId));
        if (state?.buzzerStatus) return;

        const normalizedTeam = team.toLowerCase();
        await db
          .update(gameStatesTable)
          .set({ buzzerStatus: normalizedTeam })
          .where(eq(gameStatesTable.matchId, matchId));

        io!.to(`match:${matchId}`).emit("buzzer", { team: normalizedTeam });
        const payload = await buildStatePayload(matchId);
        io!.to(`match:${matchId}`).emit("gameState", payload);
      } catch (err) {
        logger.error({ err }, "Error handling buzz");
      }
    });

    socket.on("resetBuzzer", async ({ matchId }: { matchId: number }) => {
      try {
        await db
          .update(gameStatesTable)
          .set({ buzzerStatus: null })
          .where(eq(gameStatesTable.matchId, matchId));

        const payload = await buildStatePayload(matchId);
        io!.to(`match:${matchId}`).emit("gameState", payload);
      } catch (err) {
        logger.error({ err }, "Error resetting buzzer");
      }
    });

    socket.on(
      "awardBlock",
      async ({
        matchId,
        blockIndex,
        team,
        questionId,
      }: {
        matchId: number;
        blockIndex: number;
        team: "red" | "blue";
        questionId?: number | null;
      }) => {
        try {
          const [match] = await db
            .select()
            .from(matchesTable)
            .where(eq(matchesTable.id, matchId));
          if (!match) return;

          const size = match.boardSize === "3x3" ? 3 : 5;
          const [state] = await db
            .select()
            .from(gameStatesTable)
            .where(eq(gameStatesTable.matchId, matchId));

          const blocks = (state?.blocks || initBlocks(size)) as Block[];
          const updatedBlocks = blocks.map((b) =>
            b.index === blockIndex
              ? { ...b, owner: team, questionId: questionId ?? null }
              : b
          );
          const withMatchPoints = computeMatchPoints(updatedBlocks, size);

          await db
            .update(gameStatesTable)
            .set({
              blocks: withMatchPoints as any,
              currentBlockIndex: null,
              currentQuestionId: null,
              buzzerStatus: null,
            })
            .where(eq(gameStatesTable.matchId, matchId));

          const winner = checkWinner(withMatchPoints, size);
          if (winner) {
            await db
              .update(matchesTable)
              .set({ status: "Completed", winnerTeam: winner })
              .where(eq(matchesTable.id, matchId));

            io!.to(`match:${matchId}`).emit("matchComplete", {
              winner,
              teamName: winner === "red" ? match.redTeamName : match.blueTeamName,
            });
          }

          const payload = await buildStatePayload(matchId);
          io!.to(`match:${matchId}`).emit("gameState", payload);
          io!.to(`match:${matchId}`).emit("blockAwarded", { blockIndex, team });
        } catch (err) {
          logger.error({ err }, "Error awarding block");
        }
      }
    );

    socket.on(
      "swapQuestion",
      async ({ matchId }: { matchId: number }) => {
        try {
          const [state] = await db
            .select()
            .from(gameStatesTable)
            .where(eq(gameStatesTable.matchId, matchId));

          const questions = await db
            .select()
            .from(questionsTable)
            .where(eq(questionsTable.isActive, true));

          const excluded = state?.currentQuestionId;
          const filtered = questions.filter((q) => q.id !== excluded);
          const next = filtered[Math.floor(Math.random() * filtered.length)] || null;

          await db
            .update(gameStatesTable)
            .set({ currentQuestionId: next?.id ?? null })
            .where(eq(gameStatesTable.matchId, matchId));

          const payload = await buildStatePayload(matchId);
          io!.to(`match:${matchId}`).emit("gameState", payload);
        } catch (err) {
          logger.error({ err }, "Error swapping question");
        }
      }
    );

    socket.on(
      "discardQuestion",
      async ({ matchId }: { matchId: number }) => {
        try {
          const [state] = await db
            .select()
            .from(gameStatesTable)
            .where(eq(gameStatesTable.matchId, matchId));

          if (state?.currentQuestionId) {
            await db
              .update(questionsTable)
              .set({ isActive: false })
              .where(eq(questionsTable.id, state.currentQuestionId));
          }

          const questions = await db
            .select()
            .from(questionsTable)
            .where(eq(questionsTable.isActive, true));
          const next = questions[Math.floor(Math.random() * questions.length)] || null;

          await db
            .update(gameStatesTable)
            .set({ currentQuestionId: next?.id ?? null })
            .where(eq(gameStatesTable.matchId, matchId));

          const payload = await buildStatePayload(matchId);
          io!.to(`match:${matchId}`).emit("gameState", payload);
        } catch (err) {
          logger.error({ err }, "Error discarding question");
        }
      }
    );

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
}

export { buildStatePayload, getOrCreateGameState };
