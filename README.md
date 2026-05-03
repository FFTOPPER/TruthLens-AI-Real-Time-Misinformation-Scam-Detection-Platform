# TruthLens AI — Real-Time Misinformation & Scam Detection Platform

TruthLens AI is a full-stack web application that analyses text, images, and videos for misinformation, scams, deepfakes, and psychological manipulation tactics. It uses OpenAI to produce detailed credibility scores, manipulation breakdowns, cognitive impact assessments, and plain-English explanations — all in real time.

---

## Features

### Dashboard — Analysis Terminal
- Paste any text and receive an instant credibility score (0–100)
- Risk level classification: **High / Medium / Low**
- Manipulation signal bars: Fear, Urgency, Emotional Triggers, Fake Authority
- Flagged suspicious phrases highlighted with context
- **Counter Truth** — AI rewrites the content in a neutral, fact-based tone
- **Cognitive Impact** — neural brain-map diagram showing which psychological techniques are active (Fear Induction, Urgency Pressure, Authority Bias, Social Proof)
- **Explain Deeply** — plain-English AI advisor that explains what the content is doing and why, detects patterns, and gives step-by-step safety actions
- **Voice readout** — text-to-speech narration of findings
- Animated trust orb and credibility gauge

### Scan History
- Full log of every analysis run in the current session
- Credibility score, risk level, timestamp, and snippet for each entry

### Global Intelligence
- Aggregate threat metrics and statistics across all scans
- Risk distribution charts and manipulation signal averages

### Image Scan (OCR + AI)
- Upload or paste an image URL
- Extracts text via OCR then runs the full misinformation analysis pipeline
- Flags manipulative visual content and suspicious embedded text

### Video / Deepfake Scan
- Paste a YouTube URL to analyse a video
- Fetches real metadata via YouTube oEmbed
- Sub-scores for deepfake likelihood, misinformation content, and sensationalism
- Risk classification with colour-coded indicators

### What If? — 3D Interactive Simulator
- Eight fully realistic scam and misinformation scenarios rendered in an interactive 3D bubble world (Three.js / React Three Fiber)
- Scenarios include: Barclays phishing, Stanford diabetes cure hoax, Royal Mail parcel scam, pig-butchering crypto DM, Munich romance scam, Sunak deepfake clip, Amazon fake job deposit scam, AI voice clone impersonation
- Click any bubble to expand the full scenario with outcome and safety tips

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| 3D / WebGL | Three.js, React Three Fiber, Drei |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Replit managed) |
| ORM | Drizzle ORM |
| AI | OpenAI (`gpt-4o-mini`) via Replit AI Integrations |
| Monorepo | pnpm workspaces |
| API contract | OpenAPI + Orval codegen (React Query hooks + Zod schemas) |
| Logging | Pino |

---

## Project Structure

```
/
├── artifacts/
│   ├── truthlens/          # React + Vite frontend
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx          # Dashboard / analysis terminal
│   │       │   ├── History.tsx       # Scan history feed
│   │       │   ├── Stats.tsx         # Global intelligence
│   │       │   ├── ImageScan.tsx     # OCR + AI image analysis
│   │       │   ├── VideoScan.tsx     # Deepfake / video analysis
│   │       │   ├── WhatIf.tsx        # 3D scenario simulator
│   │       │   └── Settings.tsx      # System configuration
│   │       └── components/
│   │           ├── Layout.tsx        # Navigation shell
│   │           ├── Gauge.tsx         # Credibility gauge
│   │           ├── TrustOrb.tsx      # Animated trust orb
│   │           └── VoiceControls.tsx # TTS controls
│   └── api-server/         # Express REST API
│       └── src/
│           ├── index.ts              # Server entry point
│           ├── db/                   # Drizzle schema + migrations
│           └── routes/
│               └── analysis.ts       # All AI analysis endpoints
├── lib/
│   └── api-client-react/   # Auto-generated React Query hooks
├── scripts/                # Shared utility scripts
├── pnpm-workspace.yaml
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analysis/analyze` | Full text analysis — score, risk, manipulation, cognitive impact, counter truth |
| `POST` | `/api/analysis/explain` | Plain-English deep explanation with patterns and next steps |
| `POST` | `/api/analysis/tts` | Text-to-speech synthesis of findings |
| `POST` | `/api/analysis/image` | OCR extraction + AI analysis of an image |
| `POST` | `/api/analysis/video` | Deepfake and misinformation analysis of a YouTube video |
| `POST` | `/api/analysis/whatif` | AI-generated outcome for a What If? scenario |
| `GET` | `/api/analysis/history` | Retrieve the 20 most recent analysis records |
| `GET` | `/api/analysis/stats` | Aggregate statistics across all analyses |

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database
- OpenAI API key (or Replit AI Integrations)

### Installation

```bash
# Install all workspace dependencies
pnpm install

# Set environment variables
# DATABASE_URL=<your postgres connection string>
# OPENAI_API_KEY=<your openai key>
# SESSION_SECRET=<random secret>
```

### Running in Development

```bash
# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (separate terminal)
pnpm --filter @workspace/truthlens run dev
```

The frontend runs on `http://localhost:5173` and the API server on `http://localhost:8080`.

### Database Migrations

```bash
pnpm --filter @workspace/api-server run db:push
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI analysis |
| `SESSION_SECRET` | Yes | Secret for session signing |
| `PORT` | No | API server port (default 8080) |

---

## Key Design Decisions

- **Contract-first API** — OpenAPI spec defined first; React Query hooks and Zod validators are auto-generated via Orval, keeping frontend and backend in sync.
- **Graceful AI fallbacks** — Every AI response is parsed field-by-field with typed fallbacks. If the model returns an empty or malformed response, the user always sees meaningful output rather than an error.
- **`|| "{}"` not `?? "{}"`** — The OpenAI client can return an empty string `""` on refusals. Using `||` instead of `??` ensures empty strings are also caught and replaced with the safe fallback object.
- **Three.js colour safety** — Only 6-character hex colours are used with Three.js materials. Alpha/transparency is handled via the `opacity` prop, never by appending digits to a hex string.
- **pnpm monorepo** — Shared types live in `lib/` packages; `artifacts/` are leaf packages that never import from each other.

---

## License

MIT
