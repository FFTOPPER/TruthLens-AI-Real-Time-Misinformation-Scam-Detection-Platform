# TruthLens AI
### Real-Time Misinformation & Scam Detection Platform



<div align="center">
<img src="screenshots/dashboard.jpg" alt="TruthLens AI" width="100%"/>



[![Live](https://img.shields.io/badge/status-live-brightgreen?style=flat-square)](https://truthlensai-real-time-misinformati.FFTOPPER.repl.co)
-----
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o--mini-412991?style=flat-square&logo=openai)](https://openai.com)
------
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev)
------
[![Express](https://img.shields.io/badge/Backend-Express%20%2B%20TypeScript-000000?style=flat-square&logo=express)](https://expressjs.com)
------
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
-------
[![Three.js](https://img.shields.io/badge/3D-Three.js%20%2F%20R3F-black?style=flat-square&logo=threedotjs)](https://threejs.org)

> **Know what's real.** TruthLens AI analyses text, images, and videos for scams, misinformation, deepfakes, and psychological manipulation — in real time, with plain-English explanations anyone can understand.

</div>

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Key Design Decisions](#key-design-decisions)
- [License](#license)

---

## Features

| Feature | Description |
|---|---|
| **Dashboard — Analysis Terminal** | Paste any text and get an instant credibility score, risk level, manipulation signal breakdown, flagged phrases, cognitive impact map, counter-truth rewrite, and a plain-English AI explanation |
| **Scan History** | Full chronological log of every analysis — score, risk, timestamp, and snippet |
| **Global Intelligence** | Aggregate threat stats: risk distribution charts, average manipulation vectors, total analyses |
| **Image Scan** | Upload a screenshot or image — OCR extracts the text, then the full AI analysis pipeline runs |
| **Video / Deepfake Scan** | Paste a YouTube URL — fetches real metadata and scores for deepfake likelihood, misinformation, and sensationalism |
| **What If? Simulator** | 8 fully realistic 3D scam scenarios (phishing, romance scam, deepfake clip, AI voice clone, crypto DM, and more) — choose your response and see the outcome |
| **Voice Readout** | Text-to-speech narration of findings via the TTS endpoint |
| **Settings** | Configure AI engine, display preferences, and performance options |

---

## Screenshots

### Dashboard — Analysis Terminal
> Paste any text. Hit Scan. Get the truth.

![Dashboard](screenshots/dashboard.jpg)

The main analysis terminal features:
- **Credibility Score** (0–100 gauge) — colour-coded from green (safe) to red (danger)
- **Animated Trust Orb** — WebGL visualiser that reacts to the risk level
- **Risk Level** — High / Medium / Low with colour-coded DANGER / CAUTION / SAFE indicators
- **Manipulation Signal Bars** — Fear Tactics, Urgency Language, Emotional Triggers, Fake Authority (each 0–100)
- **Flagged Phrases** — suspicious words and phrases highlighted with context
- **Counter Truth** — AI rewrites the content in a neutral, fact-based, manipulation-free version
- **Cognitive Impact** — neural brain-map diagram showing which psychological techniques are active with detailed mechanism cards
- **Explain Deeply** — plain-English AI advisor button that generates a full breakdown with detected patterns and step-by-step safety actions
- **Voice Readout** — text-to-speech narration of the full findings
- Three built-in sample texts (scam, misleading, safe) to explore immediately

---

### Scan History — Intelligence Feed
> Every scan you run is logged here in real time.

![Scan History](screenshots/history.jpg)

- Chronological feed of all analyses sorted by most recent
- Each record shows credibility score (colour-coded ring), risk badge, text snippet, and timestamp
- Displays up to 20 most recent records from the database
- Live badge shows feed is updated in real time

---

### Global Intelligence — Threat Metrics
> Aggregate statistics across every analysis ever run.

![Global Intelligence](screenshots/stats.jpg)

- **Overview panel** — total analyses, average credibility score, safe rate percentage
- **Risk Distribution** — horizontal bar chart showing Safe / Medium / High split at a glance
- **Average Manipulation Vectors** — bar chart for Fear, Urgency, Emotional Triggers, Fake Authority averages across all scans
- All metrics update live as new scans are submitted

---

### Image Scan — OCR + AI Analysis
> Upload a screenshot. AI reads it and runs the full misinformation check.

![Image Scan](screenshots/image-scan.jpg)

- Drag and drop or click to upload JPG, PNG, or WEBP images
- OCR engine extracts all visible text from the image
- Extracted text is fed directly into the full analysis pipeline
- Results include the same credibility score, risk level, manipulation breakdown, and flagged phrases as a standard text scan
- Designed for analysing screenshots of WhatsApp messages, emails, social media posts, and news articles

---

### Video Scan — Deepfake & Misinformation AI
> Paste a YouTube link. AI detects deepfakes and misinformation in seconds.

![Video Scan](screenshots/video-scan.jpg)

- Paste any YouTube URL or use the built-in sample links (YouTube News, Rumble Clip, TikTok Health)
- Fetches real video metadata via YouTube oEmbed (title, channel, thumbnail, description)
- Scores the content across three dimensions:
  - **Deepfake Likelihood** (purple) — visual and audio manipulation indicators
  - **Misinformation Content** (orange) — false or misleading claims
  - **Sensationalism** (yellow) — exaggerated or emotionally manipulative framing
- Returns an overall risk rating and a full written analysis

---

### What If? — 3D Interactive Scam Simulator
> Step inside 8 realistic scam scenarios. Choose your response. See what happens.

![What If? Simulator](screenshots/whatif.jpg)

Eight fully realistic, deeply detailed scenarios rendered in an interactive layout:

| Scenario | Description |
|---|---|
| **Phishing Email** | Barclays security alert with real-looking IP address and login details |
| **Viral Health Claim** | Stanford doctor "silenced" after publishing a diabetes cure |
| **Delivery Scam Text** | Royal Mail parcel held — £2.40 customs fee with a real-looking tracking number |
| **Crypto Investment DM** | Quant analyst offering access to a private trading pool |
| **Romance Scam** | EU engineer stranded in Munich needs €850 urgently |
| **Viral Deepfake Clip** | Rishi Sunak "leaked" clip — bank accounts freeze at midnight |
| **Fake Job Offer** | Amazon remote role — £149 refundable security deposit required |
| **AI Voice Clone Call** | It sounds exactly like your grandson — it isn't |

Click a scenario → read the full message → choose your response → the AI generates a realistic outcome showing what would have happened.

---

### Settings — System Config
> Configure the AI engine and display preferences.

![Settings](screenshots/settings.jpg)

- **AI Engine** — model (GPT-5 Mini), provider (OpenAI), max tokens, analysis mode, response format
- **Display Preferences** — toggle animated background orbs, 3D Trust Orb WebGL visualiser, smooth page transitions, high contrast mode
- **Performance** — GPU rendering options for lower-end devices

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 7 |
| **Styling** | Tailwind CSS v4, Framer Motion |
| **3D / WebGL** | Three.js, React Three Fiber, Drei |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | PostgreSQL (managed) |
| **ORM** | Drizzle ORM |
| **AI** | OpenAI `gpt-4o-mini` via Replit AI Integrations |
| **API Contract** | OpenAPI spec + Orval codegen → React Query hooks + Zod schemas |
| **Monorepo** | pnpm workspaces |
| **Logging** | Pino (structured JSON logs, `req.log` in handlers) |
| **Bundler** | esbuild (API server), Vite (frontend) |

---

## Project Structure

```
/
├── artifacts/
│   ├── truthlens/                  # React + Vite frontend
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx        # Dashboard / analysis terminal
│   │       │   ├── History.tsx     # Scan history feed
│   │       │   ├── Stats.tsx       # Global intelligence metrics
│   │       │   ├── ImageScan.tsx   # OCR + AI image analysis
│   │       │   ├── VideoScan.tsx   # Deepfake / video analysis
│   │       │   ├── WhatIf.tsx      # 3D scenario simulator
│   │       │   └── Settings.tsx    # System configuration
│   │       └── components/
│   │           ├── Layout.tsx      # Navigation shell
│   │           ├── Gauge.tsx       # Credibility gauge
│   │           ├── TrustOrb.tsx    # Animated WebGL trust orb
│   │           └── VoiceControls.tsx # TTS playback controls
│   └── api-server/                 # Express REST API
│       └── src/
│           ├── index.ts            # Server entry + Pino logger
│           ├── db/                 # Drizzle schema + migrations
│           └── routes/
│               └── analysis.ts     # All AI analysis endpoints
├── lib/
│   └── api-client-react/           # Auto-generated React Query hooks (Orval)
├── scripts/                        # Shared utility scripts
├── screenshots/                    # README screenshots
├── pnpm-workspace.yaml
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analysis/analyze` | Full text analysis — credibility score, risk level, manipulation breakdown, cognitive impact, counter truth |
| `POST` | `/api/analysis/explain` | Plain-English deep explanation with detected patterns and next steps |
| `POST` | `/api/analysis/tts` | Text-to-speech synthesis of the analysis findings |
| `POST` | `/api/analysis/image` | OCR text extraction from an image + full AI analysis |
| `POST` | `/api/analysis/video` | Deepfake and misinformation scoring for a YouTube video URL |
| `POST` | `/api/analysis/whatif` | AI-generated realistic outcome for a What If? scenario choice |
| `GET` | `/api/analysis/history` | Retrieve the 20 most recent analysis records |
| `GET` | `/api/analysis/stats` | Aggregate statistics across all analyses |

### Example — Text Analysis

```bash
curl -X POST https://your-domain/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT: Your account has been suspended. Click here immediately."}'
```

```json
{
  "credibilityScore": 8,
  "riskLevel": "High",
  "explanation": "This message uses manufactured urgency and impersonation...",
  "suspiciousPhrases": ["URGENT", "suspended", "Click here immediately"],
  "manipulationBreakdown": {
    "fear": 88,
    "urgency": 95,
    "emotionalTriggers": 72,
    "fakeAuthority": 80
  },
  "cognitiveImpact": {
    "brainReaction": "Triggers the amygdala and activates the fight-or-flight response...",
    "techniques": [
      { "name": "Fear Induction", "active": true, "mechanism": "..." },
      { "name": "Urgency Pressure", "active": true, "mechanism": "..." }
    ]
  },
  "counterTruth": "Your account status can be checked by visiting the official website directly..."
}
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/FFTOPPER/TruthLens-AI-Real-Time-Misinformation-Scam-Detection-Platform.git
cd TruthLens-AI-Real-Time-Misinformation-Scam-Detection-Platform

# Install all workspace dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in `artifacts/api-server/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/truthlens
OPENAI_API_KEY=sk-...
SESSION_SECRET=your-random-secret-here
PORT=8080
```

### Database Setup

```bash
pnpm --filter @workspace/api-server run db:push
```

### Running in Development

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5173)
pnpm --filter @workspace/truthlens run dev
```

Open `http://localhost:5173` in your browser.

### Building for Production

```bash
# Build the API server
pnpm --filter @workspace/api-server run build

# Build the frontend
pnpm --filter @workspace/truthlens run build
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for all AI analysis |
| `SESSION_SECRET` | Yes | Secret for session signing |
| `PORT` | No | API server port (default `8080`) |

---

## Key Design Decisions

**Contract-first API**
OpenAPI spec is defined first. React Query hooks and Zod validators are auto-generated via Orval, keeping frontend and backend always in sync. The server uses Zod to validate every input and output.

**Graceful AI fallbacks**
Every AI response is parsed field-by-field with typed fallbacks. If the model returns an empty or malformed response, the user always sees meaningful output — never a blank error screen. This is especially important for the `/explain` endpoint where the full JSON structure is large.

**`|| "{}"` not `?? "{}"`**
The OpenAI client can return an empty string `""` on refusals or token limit hits. Using `||` instead of `??` ensures empty strings are also caught and replaced with the safe fallback object (since `?? ` only guards against `null`/`undefined`).

**Three.js colour safety**
Only 6-character hex colours (`#rrggbb`) are used with Three.js materials. Alpha/transparency is handled via the `opacity` prop on materials — never by appending digits to a hex string (which Three.js silently rejects).

**pnpm monorepo**
Shared types and API client code live in `lib/` packages. `artifacts/` are leaf packages that never import from each other. This prevents circular dependencies and keeps builds fast and isolated.

**Structured logging**
All server code uses Pino. Route handlers use `req.log` (never `console.log`). Non-request code uses the singleton `logger` instance. All logs are structured JSON with request context for easy filtering.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with React, Express, OpenAI, and Three.js

**[Live Demo](https://truthlensai-real-time-misinformati.FFTOPPER.repl.co)** · **[Report a Bug](https://github.com/FFTOPPER/TruthLens-AI-Real-Time-Misinformation-Scam-Detection-Platform/issues)**

</div>
