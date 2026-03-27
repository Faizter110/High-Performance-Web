import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { questionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateQuestionBody,
  GetQuestionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const query = GetQuestionsQueryParams.parse(req.query);
  let questions = await db.select().from(questionsTable);
  if (query.category) {
    questions = questions.filter((q) => q.category === query.category);
  }
  if (query.difficulty) {
    questions = questions.filter((q) => q.difficulty === query.difficulty);
  }
  res.json(questions);
});

router.post("/", async (req, res) => {
  const body = CreateQuestionBody.parse(req.body);
  const [created] = await db.insert(questionsTable).values(body).returning();
  res.status(201).json(created);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [question] = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.id, id));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.json(question);
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = CreateQuestionBody.partial().parse(req.body);
  const [updated] = await db
    .update(questionsTable)
    .set(body)
    .where(eq(questionsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.update(questionsTable).set({ isActive: false }).where(eq(questionsTable.id, id));
  res.status(204).send();
});

export default router;
