import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";
import { db, analysesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router = Router();

type ManipulationBreakdown = {
  fear: number;
  urgency: number;
  emotionalTriggers: number;
  fakeAuthority: number;
};

const defaultBreakdown: ManipulationBreakdown = {
  fear: 0,
  urgency: 0,
  emotionalTriggers: 0,
  fakeAuthority: 0,
};

router.post("/analysis/analyze", async (req, res) => {
  const { text } = req.body as { text: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const prompt = `You are an expert misinformation and manipulation detection AI. Deeply analyze the following text.

Text to analyze:
"""
${text}
"""

Respond ONLY with valid JSON in this exact format — no extra text, no markdown:
{
  "credibilityScore": <integer 0-100, where 100 = fully credible>,
  "riskLevel": "<Low|Medium|High>",
  "explanation": "<2-4 sentence explanation of why the content is risky or credible, citing specific evidence from the text>",
  "suspiciousPhrases": ["<exact phrase from text that is suspicious>"],
  "manipulationBreakdown": {
    "fear": <integer 0-100, how much fear language/tactics are used — threats, danger, doom language>,
    "urgency": <integer 0-100, urgency/scarcity language — "act now", deadlines, FOMO>,
    "emotionalTriggers": <integer 0-100, emotional manipulation — outrage, sympathy bait, tribalism>,
    "fakeAuthority": <integer 0-100, fake credentials, unverified experts, anonymous sources, misleading statistics>
  }
}

Scoring guidelines:
- credibilityScore 70-100 → riskLevel "Low": factual, balanced, verifiable
- credibilityScore 40-69 → riskLevel "Medium": some manipulation, unverified claims, emotional language
- credibilityScore 0-39 → riskLevel "High": misinformation, scam tactics, extreme manipulation, conspiracy theories
- manipulationBreakdown values are independent scores (0 = none detected, 100 = extreme use)
- suspiciousPhrases: include 0-5 exact phrases from the text that are most problematic, empty array if none`;

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
      manipulationBreakdown: ManipulationBreakdown;
    };
    try {
      parsed = JSON.parse(responseText);
      if (!parsed.manipulationBreakdown) {
        parsed.manipulationBreakdown = defaultBreakdown;
      }
    } catch {
      parsed = {
        credibilityScore: 50,
        riskLevel: "Medium",
        explanation: "Unable to parse AI response. Please try again.",
        suspiciousPhrases: [],
        manipulationBreakdown: defaultBreakdown,
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
        manipulationBreakdown: JSON.stringify(parsed.manipulationBreakdown),
      })
      .returning();

    res.json({
      id: String(record.id),
      credibilityScore: parsed.credibilityScore,
      riskLevel: parsed.riskLevel,
      explanation: parsed.explanation,
      suspiciousPhrases: parsed.suspiciousPhrases,
      manipulationBreakdown: parsed.manipulationBreakdown,
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
        manipulationBreakdown: (() => {
          try {
            return JSON.parse(r.manipulationBreakdown) as ManipulationBreakdown;
          } catch {
            return defaultBreakdown;
          }
        })(),
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
      .select({ avg: sql<string>`avg(credibility_score::numeric)::text` })
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

    const manipulation = await db
      .select({
        fear: sql<string>`coalesce(avg((manipulation_breakdown::json->>'fear')::numeric), 0)::text`,
        urgency: sql<string>`coalesce(avg((manipulation_breakdown::json->>'urgency')::numeric), 0)::text`,
        emotionalTriggers: sql<string>`coalesce(avg((manipulation_breakdown::json->>'emotionalTriggers')::numeric), 0)::text`,
        fakeAuthority: sql<string>`coalesce(avg((manipulation_breakdown::json->>'fakeAuthority')::numeric), 0)::text`,
      })
      .from(analysesTable);

    const toNum = (v: string | null | undefined) => Math.round(Number(v ?? 0));

    res.json({
      totalAnalyses: total[0]?.count ?? 0,
      avgCredibilityScore: Math.round(Number(avgScore[0]?.avg ?? 0) * 10) / 10,
      riskDistribution: {
        Low: low[0]?.count ?? 0,
        Medium: medium[0]?.count ?? 0,
        High: high[0]?.count ?? 0,
      },
      avgManipulation: {
        fear: toNum(manipulation[0]?.fear),
        urgency: toNum(manipulation[0]?.urgency),
        emotionalTriggers: toNum(manipulation[0]?.emotionalTriggers),
        fakeAuthority: toNum(manipulation[0]?.fakeAuthority),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/* ── TTS: tts-1 (fast) + fable voice (warm, cheerful male) ────── */
router.post("/analysis/tts", async (req, res) => {
  const { text } = req.body as { text: string };
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  try {
    // tts-1 is OpenAI's low-latency model — starts streaming in ~200ms
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "fable",          // warm, expressive, cheerful male
      input: text.trim(),
      response_format: "mp3",
      speed: 1.05,             // slight energy boost
    } as Parameters<typeof openai.audio.speech.create>[0]);

    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "no-store");
    // Stream directly so client starts playing before full generation done
    const nodeStream = speech.body as unknown as NodeJS.ReadableStream;
    nodeStream.pipe(res);
  } catch (err) {
    req.log.error({ err }, "TTS failed");
    res.status(500).json({ error: "TTS failed" });
  }
});

export default router;
