import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";
import { db, analysesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router = Router();

/** Strip markdown code fences and extract raw JSON string */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const firstBrace = raw.indexOf("{");
  if (firstBrace !== -1) return raw.slice(firstBrace);
  return raw.trim();
}

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

  const prompt = `You are an expert misinformation, manipulation, and cognitive psychology AI. Deeply analyze the following text.

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
  },
  "cognitiveImpact": {
    "brainReaction": "<1-2 sentences describing exactly how a human brain psychologically reacts to this content — which cognitive biases fire, what emotional state it induces, how it hijacks decision-making>",
    "techniques": [
      {"name": "Fear Induction", "active": <true if fear tactics significantly present>, "mechanism": "<if active: exactly how this text triggers fear and what brain region/response it targets. If inactive: 'Not detected in this content'>"},
      {"name": "Urgency Pressure", "active": <true if urgency/FOMO significantly present>, "mechanism": "<if active: how this creates artificial time pressure and bypasses rational thinking. If inactive: 'Not detected in this content'>"},
      {"name": "Authority Bias", "active": <true if fake authority significantly present>, "mechanism": "<if active: how this exploits trust in authority figures and credentials. If inactive: 'Not detected in this content'>"},
      {"name": "Social Proof", "active": <true if crowd/peer pressure tactics used>, "mechanism": "<if active: how this uses herd mentality and social conformity to manipulate. If inactive: 'Not detected in this content'>"}
    ]
  },
  "counterTruth": "<rewrite the original message in 2-3 sentences as a factual, calm, neutral version — strip all manipulation, false urgency, unverified claims, emotional triggers, exaggerations. Keep only verifiable facts. If no facts exist, write what an honest version would say.>"
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
      max_completion_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0]?.message?.content ?? "{}";
    let parsed: {
      credibilityScore: number;
      riskLevel: string;
      explanation: string;
      suspiciousPhrases: string[];
      manipulationBreakdown: ManipulationBreakdown;
      cognitiveImpact?: {
        brainReaction: string;
        techniques: { name: string; active: boolean; mechanism: string }[];
      };
      counterTruth?: string;
    };
    try {
      parsed = JSON.parse(extractJson(responseText));
      if (!parsed.manipulationBreakdown) parsed.manipulationBreakdown = defaultBreakdown;
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
      cognitiveImpact: parsed.cognitiveImpact ?? null,
      counterTruth: parsed.counterTruth ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Analysis failed");
    res.status(500).json({ error: "Analysis failed" });
  }
});

/* ── Deep Explain ───────────────────────────────────────────── */
router.post("/analysis/explain", async (req, res) => {
  const { text, credibilityScore, riskLevel, manipulationBreakdown } = req.body as {
    text: string;
    credibilityScore: number;
    riskLevel: string;
    manipulationBreakdown: ManipulationBreakdown;
  };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const prompt = `You are a warm, knowledgeable digital safety advisor speaking directly to an everyday person — not a tech expert. You analyzed this content and found:

Risk Level: ${riskLevel}
Credibility Score: ${credibilityScore}/100
Manipulation signals — fear: ${manipulationBreakdown.fear}/100, urgency: ${manipulationBreakdown.urgency}/100, emotional triggers: ${manipulationBreakdown.emotionalTriggers}/100, fake authority: ${manipulationBreakdown.fakeAuthority}/100

Original content:
"""
${text.slice(0, 800)}
"""

Respond ONLY with valid JSON in this exact format — no markdown, no extra text:
{
  "summary": "<1-2 conversational sentences as if explaining to a friend. Use 'this message', 'you'. Be warm and direct. Example: 'This message is designed to make you panic so you act without thinking. It's using classic scam tactics.'>",
  "whyMisleading": "<3-5 sentences explaining WHY this is problematic or safe. Reference specific elements from the text. Conversational, no jargon — explain how it works on a psychological level.>",
  "patternsDetected": [
    {"name": "<short pattern name — e.g. 'Manufactured Urgency' or 'False Authority'>", "description": "<1-2 sentences: what this pattern is and exactly how it appears in this content>", "severity": "<low|medium|high>"}
  ],
  "nextSteps": [
    {"step": 1, "action": "<imperative short phrase — e.g. 'Don't click any links'>", "why": "<1 concise sentence explaining why this matters>"}
  ]
}

Rules:
- patternsDetected: 2-4 items, only include patterns genuinely present. Skip patterns with 0 signals.
- nextSteps: 3-5 practical, specific actions the person should actually take
- If risk is Low, still give helpful context about what's safe and why
- Keep tone conversational, warm, and empowering — not scary`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0]?.message?.content ?? "{}";
    let parsed: {
      summary: string;
      whyMisleading: string;
      patternsDetected: { name: string; description: string; severity: string }[];
      nextSteps: { step: number; action: string; why: string }[];
    };
    try {
      parsed = JSON.parse(extractJson(responseText));
    } catch {
      req.log.error({ rawSlice: responseText.slice(0, 300) }, "Explain JSON parse failed");
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Explain deeply failed");
    res.status(500).json({ error: "Explain failed" });
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

/* ── TTS: echo voice (deep male) via gpt-audio ─────────────── */
router.post("/analysis/tts", async (req, res) => {
  const { text } = req.body as { text: string };
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  try {
    const audioBuffer = await textToSpeech(text.trim(), "echo", "mp3");
    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "no-store");
    res.send(audioBuffer);
  } catch (err) {
    req.log.error({ err }, "TTS failed");
    res.status(500).json({ error: "TTS failed" });
  }
});

export default router;
