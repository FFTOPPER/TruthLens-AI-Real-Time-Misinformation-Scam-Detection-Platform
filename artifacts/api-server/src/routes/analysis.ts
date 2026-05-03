import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech, convertToWav } from "@workspace/integrations-openai-ai-server/audio";
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

/* ── Voice Q&A ──────────────────────────────────────────────── */
router.post("/analysis/ask", async (req, res) => {
  const { audioBase64, analysisContext } = req.body as {
    audioBase64: string;
    analysisContext: {
      credibilityScore: number;
      riskLevel: string;
      explanation: string;
      suspiciousPhrases: string[];
      manipulationBreakdown: ManipulationBreakdown;
    };
  };

  if (!audioBase64 || !analysisContext) {
    res.status(400).json({ error: "audioBase64 and analysisContext are required" });
    return;
  }

  try {
    const rawBuffer = Buffer.from(audioBase64, "base64");
    const wavBuffer = await convertToWav(rawBuffer);
    const wavBase64 = wavBuffer.toString("base64");

    const { credibilityScore, riskLevel, explanation, manipulationBreakdown: mb, suspiciousPhrases } = analysisContext;

    const systemPrompt = `You are a warm, concise AI assistant for TruthLens, a content credibility app. The user is asking about a piece of content that was analyzed with these results:
- Credibility: ${credibilityScore}/100 (${riskLevel} risk)
- Summary: ${explanation}
- Manipulation signals — fear: ${mb.fear}/100, urgency: ${mb.urgency}/100, emotional: ${mb.emotionalTriggers}/100, fake authority: ${mb.fakeAuthority}/100
- Flagged phrases: ${suspiciousPhrases.join(", ") || "none"}
Answer the user's spoken question in 1-3 short conversational sentences. Be warm, direct, no jargon.`;

    const response = await (openai.chat.completions.create as Function)({
      model: "gpt-audio",
      modalities: ["text", "audio"],
      audio: { voice: "echo", format: "mp3" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: [{ type: "input_audio", input_audio: { data: wavBase64, format: "wav" } }] },
      ],
    });

    const message = response.choices[0]?.message as Record<string, unknown>;
    const audio = message?.audio as Record<string, unknown> | undefined;
    const transcript = (audio?.transcript as string) || (message?.content as string) || "";
    const audioData = (audio?.data as string) ?? "";

    res.json({ transcript, audioBase64: audioData });
  } catch (err) {
    req.log.error({ err }, "Voice Q&A failed");
    res.status(500).json({ error: "Voice Q&A failed" });
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

  const safeScore = typeof credibilityScore === "number" ? credibilityScore : 50;
  const safeLevel = typeof riskLevel === "string" ? riskLevel : "Medium";
  const bd = manipulationBreakdown ?? { fear: 0, urgency: 0, emotionalTriggers: 0, fakeAuthority: 0 };

  const prompt = `You are a warm digital-safety advisor explaining a scan result to an everyday person. Keep language simple and conversational — no jargon.

SCAN RESULT:
Risk Level: ${safeLevel} | Credibility Score: ${safeScore}/100
Manipulation signals: fear ${bd.fear}/100, urgency ${bd.urgency}/100, emotional triggers ${bd.emotionalTriggers}/100, fake authority ${bd.fakeAuthority}/100

CONTENT ANALYSED:
"""
${text.slice(0, 700)}
"""

Return ONLY raw JSON — no markdown fences, no extra text:
{"summary":"<2 plain sentences explaining what this content is doing and whether it is safe. Use 'this message' and 'you'. E.g. This message is trying to make you panic so you act without thinking. It is using a classic fear tactic to steal your information.>","whyMisleading":"<3-4 sentences explaining WHY this is safe or dangerous. Reference specific words or phrases from the content. Explain the psychology — why it works on people.>","patternsDetected":[{"name":"<short name e.g. Manufactured Urgency>","description":"<1-2 sentences: what this pattern is and how it shows up here>","severity":"<low|medium|high>"}],"nextSteps":[{"step":1,"action":"<short imperative e.g. Do not click any links>","why":"<one sentence why>"}]}

Rules — follow exactly:
- patternsDetected: include 2 to 4 patterns actually present. Skip any with 0 signals.
- nextSteps: include 3 to 4 concrete actions the person should take right now.
- If risk is Low: explain what makes it safe and give 2-3 general tips.
- Never use markdown inside the JSON strings.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1600,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    let base: Record<string, unknown> = {};
    try {
      base = JSON.parse(extractJson(raw)) as Record<string, unknown>;
    } catch {
      req.log.error({ rawSlice: raw.slice(0, 400) }, "Explain JSON parse failed");
    }

    const normaliseArray = <T>(val: unknown, fallback: T[]): T[] =>
      Array.isArray(val) && val.length > 0 ? (val as T[]) : fallback;

    const result = {
      summary: typeof base.summary === "string" && base.summary.trim()
        ? base.summary
        : `This content has been assessed as ${safeLevel.toLowerCase()} risk with a credibility score of ${safeScore}/100. Review the signals below for details.`,

      whyMisleading: typeof base.whyMisleading === "string" && base.whyMisleading.trim()
        ? base.whyMisleading
        : safeLevel === "Low"
          ? "This content does not appear to use known manipulation tactics and is likely genuine. Always stay cautious with unexpected messages even when they seem safe."
          : "This content shows several markers commonly used in scams and misinformation. Be cautious before acting, clicking links, or sharing with others.",

      patternsDetected: normaliseArray(base.patternsDetected, [
        { name: "Analysis Incomplete", description: "The AI could not fully break down the patterns. Review the credibility score and manipulation signals above for guidance.", severity: safeScore < 40 ? "high" : safeScore < 65 ? "medium" : "low" },
      ]),

      nextSteps: normaliseArray(base.nextSteps, [
        { step: 1, action: "Do not click any links in this content", why: "Links can lead to phishing sites designed to steal your credentials." },
        { step: 2, action: "Verify the source independently", why: "Search the sender or organisation directly using a trusted search engine." },
        { step: 3, action: "Report if suspicious", why: "Reporting helps protect others from the same content." },
      ]),
    };

    res.json(result);
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

/* ── What If? simulator ─────────────────────────────────────── */
router.post("/analysis/whatif", async (req, res) => {
  const { scenarioTitle, scenarioContext, choiceLabel, choiceSublabel, severity } = req.body as {
    scenarioTitle:   string;
    scenarioContext: string;
    choiceLabel:     string;
    choiceSublabel:  string;
    severity:        "safe" | "risky" | "dangerous";
  };
  if (!scenarioTitle || !choiceLabel) {
    res.status(400).json({ error: "scenarioTitle and choiceLabel are required" });
    return;
  }
  try {
    const prompt = `You are an educational cybersecurity and digital-safety AI inside TruthLens.

A user is in this simulation:
Scenario: "${scenarioTitle}"
Content shown: "${scenarioContext.slice(0, 220)}"
Their choice: "${choiceLabel}" (${choiceSublabel ?? ""})
Severity: ${severity}

Generate a realistic, educational outcome. Return ONLY raw JSON (no markdown fences):
{
  "title": "dramatic 5-7 word title of what happened",
  "immediateEffect": "one vivid sentence of the immediate consequence",
  "whatHappens": ["step 1 of chain reaction", "step 2", "step 3", "step 4"],
  "statistic": "realistic stat e.g. '1 in 3 people who click phishing links have their credentials stolen within minutes'",
  "recovery": ["action 1", "action 2", "action 3"],
  "lesson": "one clear educational takeaway sentence"
}

If severity is "safe": show a positive realistic chain and reinforce good behaviour.
If severity is "risky" or "dangerous": show realistic harm chain (data theft, financial loss, health risk, etc) then practical recovery steps.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: {
      title?: string;
      immediateEffect?: string;
      whatHappens?: string[];
      statistic?: string;
      recovery?: string[];
      lesson?: string;
    };
    let base: Record<string, unknown> = {};
    try {
      base = JSON.parse(extractJson(raw)) as Record<string, unknown>;
    } catch { /* use empty base — defaults below will fill everything in */ }

    /* Normalise: ensure every required field exists regardless of AI quirks */
    parsed = {
      title:          typeof base.title          === "string" ? base.title          : "Outcome Generated",
      immediateEffect:typeof base.immediateEffect === "string" ? base.immediateEffect : "Your choice set off a chain of consequences.",
      whatHappens:    Array.isArray(base.whatHappens)  ? base.whatHappens as string[]  : ["The situation unfolds.", "Consequences become clear.", "Action becomes necessary.", "Lessons are learned."],
      statistic:      typeof base.statistic      === "string" ? base.statistic      : "Awareness is the first step to protection.",
      recovery:       Array.isArray(base.recovery)     ? base.recovery as string[]     : ["Stay alert.", "Verify before acting.", "Report suspicious activity."],
      lesson:         typeof base.lesson         === "string" ? base.lesson         : "Always think critically before responding to unexpected requests.",
    };
    res.json({ ...parsed, severity });
  } catch (err) {
    req.log.error({ err }, "whatif generation failed");
    res.status(500).json({ error: "Failed to generate outcome" });
  }
});

/* ── Video / Deepfake Analysis ─────────────────────────────── */
router.post("/analysis/video", async (req, res) => {
  const { url, fileName, fileType } = req.body as {
    url?: string;
    fileName?: string;
    fileType?: string;
  };

  if (!url && !fileName) {
    res.status(400).json({ error: "url or fileName is required" });
    return;
  }

  let platform   = "Unknown Platform";
  let videoTitle = fileName || "Uploaded video file";
  let videoAuthor = "";
  let thumbnailUrl = "";
  let videoContext = "";

  if (url) {
    if (/youtube\.com|youtu\.be/i.test(url))           platform = "YouTube";
    else if (/rumble\.com/i.test(url))                 platform = "Rumble";
    else if (/tiktok\.com/i.test(url))                 platform = "TikTok";
    else if (/twitter\.com|x\.com/i.test(url))         platform = "X (Twitter)";
    else if (/facebook\.com|fb\.watch/i.test(url))     platform = "Facebook";
    else if (/instagram\.com/i.test(url))              platform = "Instagram";
    else if (/bitchute\.com/i.test(url))               platform = "BitChute";
    else if (/vimeo\.com/i.test(url))                  platform = "Vimeo";
    else if (url.startsWith("http"))                   platform = "External Link";

    if (platform === "YouTube") {
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        );
        if (oembedRes.ok) {
          const oembed = await oembedRes.json() as {
            title?: string; author_name?: string; thumbnail_url?: string;
          };
          videoTitle   = oembed.title        || videoTitle;
          videoAuthor  = oembed.author_name  || "";
          thumbnailUrl = oembed.thumbnail_url || "";
        }
      } catch { /* oEmbed not critical */ }
    }

    videoContext = `Video URL: ${url}\nPlatform: ${platform}`;
    if (videoTitle)  videoContext += `\nTitle: ${videoTitle}`;
    if (videoAuthor) videoContext += `\nChannel/Author: ${videoAuthor}`;
  } else {
    platform     = "Uploaded File";
    videoContext = `Uploaded video file\nFilename: ${fileName}\nType: ${fileType || "video/*"}`;
  }

  const prompt = `You are TruthLens, a cutting-edge AI video integrity analyst specializing in deepfake detection, misinformation pattern recognition, and media manipulation analysis.

Analyze the following video for potential manipulation, misinformation, sensationalism, and deepfake risk:

${videoContext}

Evaluate for:
1. Sensational or manipulative language in the title/description
2. Platform credibility (YouTube/Vimeo generally more trustworthy; Rumble/BitChute higher risk)
3. Known misinformation patterns (miracle cures, conspiracy theories, impossible claims, extreme political content)
4. Deepfake/synthetic media risk indicators
5. URL or domain red flags
6. Channel/source credibility signals

Scoring guidance:
- riskScore 0-30 → riskLevel "Low": mainstream platform, neutral title, no obvious red flags
- riskScore 31-65 → riskLevel "Medium": some suspicious elements but not conclusive
- riskScore 66-100 → riskLevel "High": fringe platform, sensational/misleading title, clear misinformation patterns
- deepfakeRisk: base 8 for mainstream verified channels, 25 for unknown, 55+ for suspicious/fringe contexts
- Always include at least 1 credibilitySignal even for high-risk content
- For uploaded files with no verifiable context, assign moderate risk (35-55) and note lack of context

Return ONLY raw JSON with no markdown fences:
{"riskScore":<0-100>,"riskLevel":"<Low|Medium|High>","verdict":"<one punchy sentence summarizing the risk>","explanation":"<2-3 sentences of detailed analysis>","deepfakeRisk":<0-100>,"misinformationRisk":<0-100>,"sensationalismScore":<0-100>,"redFlags":["<flag1>","<flag2>"],"credibilitySignals":["<signal1>"],"platform":"<platform name>","videoTitle":"<title or Unknown>"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let base: Record<string, unknown> = {};
    try { base = JSON.parse(extractJson(raw)) as Record<string, unknown>; } catch { /* use defaults */ }

    res.json({
      riskScore:           typeof base.riskScore           === "number" ? base.riskScore           : 45,
      riskLevel:           typeof base.riskLevel           === "string" ? base.riskLevel           : "Medium",
      verdict:             typeof base.verdict             === "string" ? base.verdict             : "Analysis complete — exercise caution.",
      explanation:         typeof base.explanation         === "string" ? base.explanation         : "Unable to generate detailed analysis.",
      deepfakeRisk:        typeof base.deepfakeRisk        === "number" ? base.deepfakeRisk        : 25,
      misinformationRisk:  typeof base.misinformationRisk  === "number" ? base.misinformationRisk  : 30,
      sensationalismScore: typeof base.sensationalismScore === "number" ? base.sensationalismScore : 25,
      redFlags:            Array.isArray(base.redFlags)            ? base.redFlags            : [],
      credibilitySignals:  Array.isArray(base.credibilitySignals)  ? base.credibilitySignals  : [],
      platform:            typeof base.platform            === "string" ? base.platform            : platform,
      videoTitle:          typeof base.videoTitle          === "string" ? base.videoTitle          : videoTitle,
      thumbnailUrl,
    });
  } catch (err) {
    req.log.error({ err }, "video analysis failed");
    res.status(500).json({ error: "Failed to analyze video" });
  }
});

export default router;
