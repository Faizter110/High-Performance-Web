import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionId: text("question_id").notNull().unique(),
  text: text("text").notNull(),
  difficulty: text("difficulty").notNull().default("Medium"),
  category: text("category").notNull().default("General"),
  answer: text("answer"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;

export const tournamentsTable = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  event: text("event").notNull().default("Ramadan 2026"),
  division: text("division").notNull().default("Adults"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournamentsTable).omit({ id: true, createdAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournamentsTable.$inferSelect;

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  matchNumber: integer("match_number").notNull(),
  tournamentId: integer("tournament_id"),
  redTeamName: text("red_team_name").notNull(),
  blueTeamName: text("blue_team_name").notNull(),
  boardSize: text("board_size").notNull().default("5x5"),
  status: text("status").notNull().default("Scheduled"),
  round: text("round"),
  winnerTeam: text("winner_team"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;

export const gameStatesTable = pgTable("game_states", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().unique(),
  blocks: jsonb("blocks").notNull().default([]),
  buzzerStatus: text("buzzer_status"),
  currentBlockIndex: integer("current_block_index"),
  currentQuestionId: integer("current_question_id"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGameStateSchema = createInsertSchema(gameStatesTable).omit({ id: true, updatedAt: true });
export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type GameState = typeof gameStatesTable.$inferSelect;
