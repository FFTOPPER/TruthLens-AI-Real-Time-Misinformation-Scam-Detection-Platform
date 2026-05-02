import { pgTable, text, serial, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  textSnippet: text("text_snippet").notNull(),
  credibilityScore: numeric("credibility_score", { precision: 5, scale: 2 }).notNull(),
  riskLevel: text("risk_level").notNull(),
  explanation: text("explanation").notNull(),
  suspiciousPhrases: text("suspicious_phrases").notNull(),
  manipulationBreakdown: text("manipulation_breakdown").notNull().default("{}"),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, analyzedAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
