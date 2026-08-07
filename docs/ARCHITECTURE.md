# VERITY — Architecture

<!--
Companion to PRD.md.
PRD says WHAT the system does. This says HOW.
Audience: an engineer who needs to understand the system well
enough to build it, debug it, or extend it.
-->

---

## 1. Stack

| Layer | Tech |
|---|---|
| Frontend Framework | Next.js 16 (App Router, TypeScript, React 19) |
| Frontend Styling | Tailwind CSS 4 · Framer Motion |
| Backend Framework | Node.js · Express 5 (TypeScript) |
| NLP Libraries | compromise 14 · natural 8 |
| API Documentation | swagger-jsdoc · swagger-ui-express |
| Security | helmet · express-rate-limit · cors |
| Testing | Vitest · Supertest · fast-check (property-based) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

No database. No auth. No queue. The system is entirely stateless.

---

## 2. Components

```
src/                         Backend (Express API)
  components/
    Analyzer.ts              Core orchestrator — runs all 9 analysis layers
    ConversationAnalyzer.ts  Parses multi-message input, scores each, aggregates
    SyntaxParser.ts          Layers 1-3: tense, agent deletion, pronoun (via compromise)
    HeuristicEngine.ts       Layers 4-5, 8: lexical diversity, negation, cognitive load
    NarrativeStructureAnalyzer.ts  Layer 6: prologue/core/epilogue detection
    InformationDensityAnalyzer.ts  Layer 7: word-distribution imbalance
    ConfidenceScorer.ts      Weighted score formula + confidence interval + verdict
    ReportGenerator.ts       Formats raw indicators into the final API response shape
  models/                    TypeScript interfaces (AnalysisReport, DeceptionIndicator, etc.)
  routes/
    analyzeRoutes.ts         POST /api/analyze — single + conversation mode
    healthRoutes.ts          GET /api/health
  utils/
    logger.ts                Structured logging
  index.ts                   Express app setup (middleware, routes, error handling)
  swagger.ts                 Swagger spec definition

client/                      Frontend (Next.js)
  app/
    page.tsx                 Landing page — hero, stats bar, feature cards
    analyze/page.tsx         Analysis UI — input panel + results panel
    how-it-works/page.tsx    Explainer page for the 9 analysis layers
    api-service.ts           Axios wrapper for POST /api/analyze
    types.ts                 Shared TypeScript types (AnalysisReport, ConversationAnalysis)
    components/
      Navbar.tsx             Navigation
      Footer.tsx             Footer
      HighlightedText.tsx    Sentence-level flag highlighting in the results panel
```

### Analyzer

The core orchestrator. Accepts a single text string, runs it through all 9 analysis layers in sequence (catching errors per-layer so a failure in one layer never kills the whole analysis), collects `DeceptionIndicator` objects, passes them to `ConfidenceScorer`, then feeds the scored indicators to `ReportGenerator`. Returns a typed `AnalyzerOutput`. Text must be 10–10,000 characters; validation happens before any NLP work.

### ConversationAnalyzer

Parses multi-message input using double-line-break splitting (primary) or timestamp-pattern splitting (fallback, supports WhatsApp format). Runs `Analyzer.analyze()` on each message independently. Calculates a recency-weighted aggregate score (`weight[i] = 1 + (i / n) * 0.5` — later messages count more). Detects cross-message patterns: story inconsistencies (entity appears, vanishes, reappears), timeline mismatches (dominant tense flips between messages), and detail contradictions (same entity, one message negated, one not). Each cross-message pattern adds up to 16 points to the aggregate score (capped at +35 total).

### SyntaxParser

Uses compromise's NLP doc model to analyse tense, agent deletion (passive voice ratio), and pronoun consistency. The doc is parsed once in `Analyzer` and passed in — avoids redundant parsing across layers.

### HeuristicEngine

Regex and word-list based analysis for lexical diversity (Type-Token Ratio), negation clustering, and cognitive-load language (hedge words, memory qualifiers, veracity-emphasis markers). No NLP library needed for these layers.

### ConfidenceScorer

Applies the scoring formula: `score = Σ(weight × severity × 100)`, capped at 100. Severity maps: low=0.33, medium=0.66, high=1.0. Confidence interval: `max(5, 20 − (textLength / 1000) × 2)` — longer texts narrow the interval. Verdicts: ≤33 `likely_truthful`, ≤66 `uncertain`, >66 `likely_lie`.

---

## 3. Data Flow

```
[Browser]
  → POST /api/analyze  { text, mode: "single" | "conversation" }
      → [analyzeRoutes.ts]
          if mode === "conversation"  → ConversationAnalyzer.analyzeConversation(text)
          else                        → Analyzer.analyze({ text })
              → SyntaxParser   (layers 1–3, shared compromise doc)
              → HeuristicEngine (layers 4–5, 8)
              → NarrativeStructureAnalyzer (layer 6)
              → InformationDensityAnalyzer (layer 7)
              → Analyzer.detectContradictions() (layer 9)
              → ConfidenceScorer.calculateScore(indicators)
              → ReportGenerator.generateReport(...)
      ← { success, data: AnalysisReport | ConversationAnalysis, timestamp, requestId }
[Browser renders score + indicator breakdown + highlighted sentences]
```

1. User pastes text and clicks Analyze on the frontend.
2. `api-service.ts` sends `POST /api/analyze` with `{ text, mode }`.
3. Route handler validates the `text` field is present.
4. `Analyzer.validateInput()` checks length (10–10,000 chars).
5. Each of the 9 NLP layers runs sequentially; failures are caught and skipped.
6. `ConfidenceScorer` computes the weighted score and confidence interval.
7. `ReportGenerator` builds the structured response (score, verdict, indicators, sentence flags, narrative structure, summary).
8. The JSON response is rendered in the right panel: animated score dial, indicator list, sentence-level highlights.

---

## 4. API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/analyze` | Analyse text for deception; `mode: "single"` (default) or `"conversation"` |
| `GET` | `/api/health` | Liveness check — returns `{ status: "ok" }` |
| `GET` | `/api-docs` | Swagger UI with full request/response schemas |
| `GET` | `/` | Root endpoint listing available endpoints |

### Request schema (`POST /api/analyze`)

```jsonc
{
  "text": "string",                    // required, 10–10,000 chars
  "mode": "single" | "conversation",   // optional, default "single"
  "options": {
    "includeExplanations": true,       // optional
    "highlightText": true              // optional
  }
}
```

### Response schema (`AnalysisReport`)

```jsonc
{
  "score": 72,                         // 0–100
  "confidence_interval": 14,           // ±N points
  "verdict": "likely_lie",             // "likely_truthful" | "uncertain" | "likely_lie"
  "indicators": [
    {
      "name": "Tense inconsistency",
      "severity": "high",              // "low" | "medium" | "high"
      "weight": 0.25,
      "contribution": 25,
      "detail": "Detected 4 unexplained tense shifts in the narrative"
    }
  ],
  "sentence_flags": [
    {
      "sentence": "...",
      "index": 2,
      "flags": ["tense_inconsistency"],
      "severity": "high"
    }
  ],
  "narrative_structure": {
    "has_prologue": true,
    "has_epilogue": false,
    "missing": ["epilogue"]
  },
  "summary": "string"
}
```

---

## 5. Security

- **API keys:** No third-party API keys used. All configuration in env vars gitignored via `.env`.
- **Rate limiting:** `express-rate-limit` — 100 requests per IP per 15 minutes. Returns `RATE_LIMIT_EXCEEDED` with standard headers.
- **HTTP hardening:** `helmet` on all routes. `contentSecurityPolicy` disabled only to allow Swagger UI inline scripts.
- **CORS:** Open (`origin: '*'`) — the API is intentionally public with no auth; rate limiting is the abuse control.
- **Input validation:** Text length validated (10–10,000 chars) before any NLP work. Body size capped at 1 MB by Express middleware.
- **No user data stored:** Stateless design — no DB, no logs of request content, no session state.

---

## 6. Error Handling & Reliability

| Failure | Behaviour |
|---|---|
| Individual NLP layer throws | Caught per-layer inside `Analyzer.analyze()` — analysis continues with remaining layers; the indicator for that layer is simply absent |
| Text too short / too long | `400` with `TEXT_TOO_SHORT` / `TEXT_TOO_LONG` error code before any NLP runs |
| Missing `text` field | `400` with `INVALID_INPUT` immediately in the route handler |
| Unhandled server error | Global error middleware returns `500` with `INTERNAL_ERROR`; error is logged via `logger.error` |
| Rate limit exceeded | `429` with `RATE_LIMIT_EXCEEDED`; standard `RateLimit-*` headers included |

---

## 7. Deployment

1. **Backend** — Render web service. `npm run build` (tsc) then `npm start` (node dist/index.js). `PORT` env var set by Render automatically.
2. **Frontend** — Vercel. `next build` triggered on push to main. `NEXT_PUBLIC_API_URL` env var points to the Render backend.
3. No migrations, no seed scripts — stateless, nothing to set up.

---

## 8. Explicit Scope Cuts

- **Database / history** — No analysis history is stored. Statefulness adds infrastructure and a data-retention surface; on-demand analysis is sufficient for the use case.
- **Authentication** — The API is public and rate-limited. No user accounts are needed.
- **Webhook / streaming** — Results fit in a single synchronous response (<500 ms). Streaming is unnecessary.
- **ML-based scoring calibration** — Indicator weights are manually tuned constants, not trained on labelled data. Empirical calibration is a v2 task (requires a ground-truth corpus).
