import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { questionsTable } from "@workspace/db/schema";
import { SyncFromSheetsBody } from "@workspace/api-zod";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.post("/sync", async (req, res) => {
  const body = SyncFromSheetsBody.parse(req.body);
  const { spreadsheetId, sheetName = "Questions" } = body;

  const connectorHost = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const replIdentity = process.env["REPL_IDENTITY"];

  if (!connectorHost || !replIdentity) {
    res.status(400).json({
      error: "Google Sheets connector not configured. Please connect Google Sheets integration first.",
    });
    return;
  }

  try {
    const range = `${sheetName}!A:E`;
    const url = `https://${connectorHost}/google-sheets/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    const response = await fetch(url, {
      headers: {
        "x-replit-identity": replIdentity,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, text }, "Google Sheets API error");
      res.status(502).json({ error: `Google Sheets API error: ${response.status}` });
      return;
    }

    const data = (await response.json()) as { values?: string[][] };
    const rows = data.values || [];

    if (rows.length < 2) {
      res.json({ synced: 0, skipped: 0, errors: 0, message: "No data rows found in sheet" });
      return;
    }

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const idIdx = headers.indexOf("question id") !== -1 ? headers.indexOf("question id") : 0;
    const textIdx = headers.indexOf("question text") !== -1 ? headers.indexOf("question text") : 1;
    const diffIdx = headers.indexOf("difficulty badge") !== -1 ? headers.indexOf("difficulty badge") : 2;
    const catIdx = headers.indexOf("category") !== -1 ? headers.indexOf("category") : 3;
    const ansIdx = headers.indexOf("answer") !== -1 ? headers.indexOf("answer") : 4;

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows.slice(1)) {
      try {
        const questionId = row[idIdx]?.trim();
        const text = row[textIdx]?.trim();
        const difficulty = row[diffIdx]?.trim() || "Medium";
        const category = row[catIdx]?.trim() || "General";
        const answer = row[ansIdx]?.trim() || null;

        if (!questionId || !text) {
          skipped++;
          continue;
        }

        await db
          .insert(questionsTable)
          .values({ questionId, text, difficulty, category, answer, isActive: true })
          .onConflictDoUpdate({
            target: questionsTable.questionId,
            set: { text, difficulty, category, answer, isActive: true },
          });
        synced++;
      } catch (err) {
        logger.error({ err }, "Error syncing row");
        errors++;
      }
    }

    res.json({
      synced,
      skipped,
      errors,
      message: `Synced ${synced} questions from Google Sheets`,
    });
  } catch (err) {
    logger.error({ err }, "Error syncing from sheets");
    res.status(500).json({ error: "Failed to sync from Google Sheets" });
  }
});

export default router;
