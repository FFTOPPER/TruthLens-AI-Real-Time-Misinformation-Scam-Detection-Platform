import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, analysesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router = Router();

router.post("/analysis/analyze", async (req, res) => {
  const { text } = req.body as { text: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const prompt = `You are an expert misinformation and manipulation detection AI. Analyze the following text for:
1. Credibility (0-100 score, where 100 is fully credible)
2. Risk level: Low, Medium, or High
3. A clear explanation of why the content is risky or credible
4. A list of suspicious phrases or sentences that raise red flags (empty array if none)

Text to analyze:
"""
${text}
"""

Respond ONLY with valid JSON in this exact format:
{
  "credibilityScore": <number 0-100>,
  "riskLevel": "<Low|Medium|High>",
  "explanation": "<detailed explanation>",
  "suspiciousPhrases": ["<phrase1>", "<phrase2>"]
}

Guidelines:
- Low risk (score 70-100): factual, balanced, from credible sources
- Medium risk (score 40-69): some manipulation tactics, unverified claims, emotional language
- High risk (score 0-39): misinformation, scam tactics, extreme manipulation, false urgency, conspiracy theories`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0]?.message?.content ?? "{}";
    let parsed: {
      credibilityScore: number;
      riskLevel: string;
      explanation: string;
      suspiciousPhrases: string[];
    };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        credibilityScore: 50,
        riskLevel: "Medium",
        explanation: "Unable to parse AI response. Please try again.",
        suspiciousPhrases: [],
      };
    }

    const snippet = text.slice(0, 200);
    const [record] = await db
      .insert(analysesTable)
      .values({
        textSnippet: snippet,
        credibilityScore: String(parsed.credibilityScore),
        riskLevel: parsed.riskLevel,
        explanation: parsed.explanation,
        suspiciousPhrases: JSON.stringify(parsed.suspiciousPhrases),
      })
      .returning();

    res.json({
      id: String(record.id),
      credibilityScore: parsed.credibilityScore,
      riskLevel: parsed.riskLevel,
      explanation: parsed.explanation,
      suspiciousPhrases: parsed.suspiciousPhrases,
    });
  } catch (err) {
    req.log.error({ err }, "Analysis failed");
    res.status(500).json({ error: "Analysis failed" });
  }
});

router.get("/analysis/history", async (req, res) => {
  try {
    const records = await db
      .select()
      .from(analysesTable)
      .orderBy(desc(analysesTable.analyzedAt))
      .limit(20);

    res.json(
      records.map((r) => ({
        id: String(r.id),
        textSnippet: r.textSnippet,
        credibilityScore: Number(r.credibilityScore),
        riskLevel: r.riskLevel,
        explanation: r.explanation,
        suspiciousPhrases: JSON.parse(r.suspiciousPhrases) as string[],
        analyzedAt: r.analyzedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.get("/analysis/stats", async (req, res) => {
  try {
    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analysesTable);

    const avgScore = await db
      .select({ avg: sql<number>`avg(credibility_score::numeric)` })
      .from(analysesTable);

    const low = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analysesTable)
      .where(sql`risk_level = 'Low'`);

    const medium = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analysesTable)
      .where(sql`risk_level = 'Medium'`);

    const high = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analysesTable)
      .where(sql`risk_level = 'High'`);

    res.json({
      totalAnalyses: total[0]?.count ?? 0,
      avgCredibilityScore: Number((avgScore[0]?.avg ?? 0).toFixed(1)),
      riskDistribution: {
        Low: low[0]?.count ?? 0,
        Medium: medium[0]?.count ?? 0,
        High: high[0]?.count ?? 0,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
