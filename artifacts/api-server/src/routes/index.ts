import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import questionsRouter from "./questions.js";
import matchesRouter from "./matches.js";
import tournamentsRouter from "./tournaments.js";
import sheetsRouter from "./sheets.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/questions", questionsRouter);
router.use("/matches", matchesRouter);
router.use("/tournaments", tournamentsRouter);
router.use("/sheets", sheetsRouter);

export default router;
