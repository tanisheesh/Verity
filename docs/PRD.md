# VERITY — Product Requirements Document

**Status:** Final  
**Owner:** Tanish Poddar  
**One-liner:** Forensic linguistic analysis that scores any text for deception patterns using 9 rule-based NLP layers — no machine learning, no black box, results in under 500 ms.

---

## 1. Problem

Detecting whether a statement is deceptive normally requires either expensive human forensic-linguistics expertise or opaque ML classifiers that can't explain their reasoning. Casual investigators, researchers, and curious users have no accessible tool that gives them an explainable, per-sentence breakdown of *why* a piece of text looks suspicious. Existing "lie detector" apps are either novelties with no scientific basis or paid enterprise products with no public API.

---

## 2. Goals (v1 / MVP)

1. Accept any text input (10–10,000 characters) and return a deception score (0–100) with a confidence interval.
2. Run 9 documented NLP analysis layers and attribute each score contribution to a specific linguistic pattern with a plain-English explanation.
3. Support a conversation mode that parses multi-message exchanges and detects cross-message inconsistencies (story drift, timeline mismatches, detail contradictions).
4. Respond in under 500 ms for typical inputs.
5. Expose a public REST API with Swagger documentation so developers can integrate the analysis into their own tools.
6. Deploy a live demo (frontend on Vercel, backend on Render) that works without any login or setup.

---

## 3. Non-Goals (explicit scope cuts)

- **Fact verification** — VERITY analyses linguistic patterns, not factual accuracy. It cannot check whether stated events actually happened.
- **User accounts / history** — No sign-up, no saved analyses. Every request is stateless.
- **ML / trained models** — The system is deliberately rule-based. No training data, no model weights, no probabilistic classifiers.
- **Real-time / streaming responses** — Analyses are fast enough for a standard synchronous request-response cycle.
- **Multi-language support** — English only in v1; the NLP libraries (compromise, natural) are English-centric.
- **Webhook integrations** — No push notifications or third-party integrations in v1.

---

## 4. Users

**Primary:** Researchers, writers, journalists, and curious individuals who want to examine a statement or conversation for linguistic deception signals and need an explanation they can follow — not just a score.

**Secondary:** Developers who want to add deception analysis to their own application via the public REST API.

**Tertiary:** Recruiters and technical interviewers evaluating this as a portfolio piece — the live demo must work immediately on novel input.

---

## 5. User Stories

1. *As a researcher,* I paste a suspect statement into the tool and receive a score and a per-indicator breakdown so that I can identify which specific linguistic patterns triggered the analysis and why.
2. *As a user,* I paste a WhatsApp conversation export and switch to conversation mode so that I can see how the person's story changed across messages and where the timeline stopped adding up.
3. *As a developer,* I call `POST /api/analyze` with a JSON body so that I can embed deception scoring into my own application without building the NLP logic myself.
4. *As a first-time visitor,* I click one of the pre-loaded examples (truthful, deceptive, conversation) so that I can understand what the tool detects before submitting my own text.
5. *As a user,* I read the "How It Works" page so that I can understand what each of the 9 analysis layers detects and how the weighted score is calculated.
6. *As a skeptic,* I review the sentence flags and indicator descriptions so that I can verify the score is grounded in documented patterns rather than arbitrary guesswork.

---

## 6. Functional Requirements

### 6.1 Text Analysis (Single Mode)

- System must accept a POST request with a `text` field (string, 10–10,000 characters).
- System must run all 9 analysis layers: tense consistency, agent deletion, pronoun consistency, lexical diversity, negation clustering, narrative structure, information density, cognitive load language, contradiction detection.
- System must return a numeric score (0–100), a confidence interval (±N), and a verdict (`likely_truthful` | `uncertain` | `likely_lie`).
- System must return a list of triggered indicators, each with: name, severity (low/medium/high), weight, contribution to score, and a plain-English detail string.
- System must return sentence-level flags linking each triggered indicator to the sentence(s) that caused it.
- System must return a narrative structure object indicating presence/absence of prologue, core event, and epilogue.

### 6.2 Conversation Analysis (Conversation Mode)

- System must parse multi-message text using double-line-break splitting (primary) or timestamp-pattern splitting (WhatsApp format fallback).
- System must score each parsed message individually using the full 9-layer pipeline.
- System must compute a recency-weighted aggregate score across all messages.
- System must detect cross-message patterns: story inconsistencies (entity appears/disappears/reappears), timeline mismatches (dominant tense flips), and detail contradictions (same entity, contradictory negation).
- System must return the aggregate score, confidence level (Low/Medium/High), and a plain-English conversation summary.

### 6.3 API

- `POST /api/analyze` must accept `mode: "single" | "conversation"` with `"single"` as default.
- `GET /api/health` must return a liveness status.
- `GET /api-docs` must serve a Swagger UI with full request/response schemas.
- Rate limit: 100 requests per IP per 15-minute window.
- Response must include `timestamp` and `requestId` on every call.

### 6.4 Frontend

- Landing page must explain the tool and provide direct links to the analysis UI and "How It Works" page.
- Analysis page must provide a mode toggle (single / conversation), a text input, and three pre-loaded examples.
- Results panel must display: animated score indicator, verdict badge, confidence interval, triggered indicators with weights, sentence-level highlighted text, and a narrative structure summary.
- "How It Works" page must document all 9 analysis layers with their weights and the scoring formula.

---

## 7. Non-Functional Requirements

- **Latency:** End-to-end analysis must complete in <500 ms for inputs under 2,000 characters on a standard Render free-tier instance.
- **Reliability:** A failure in any individual NLP layer must not fail the entire analysis — layers are isolated with per-layer error handling.
- **Security:** No user data stored. No API keys exposed client-side. Rate limiting enforced. `helmet` headers on all routes.
- **Cost:** Zero variable cost — rule-based, no LLM API calls, no paid third-party services.
- **Correctness:** Every score must be fully deterministic — identical input always produces identical output.

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Live demo reliability | Analysis completes without error on any text input within 500 ms |
| API discoverability | Swagger UI accessible and accurate at `/api-docs` |
| Explainability coverage | Every score > 0 has at least one indicator with a plain-English description |
| Conversation mode accuracy | Cross-message patterns detected in the bundled deceptive conversation example |

---

## 9. Risks & Open Questions

- **Weight validity** — The 9 indicator weights are manually tuned constants, not empirically derived. The relative importance of each layer is informed by forensic linguistics literature but not validated against a labelled corpus. Real-world precision/recall is unknown.
- **Short-text reliability** — Below ~100 words, the confidence interval is wide (up to ±20 points). The system communicates this, but users may still over-interpret scores on very short inputs.
- **Language scope** — The NLP libraries are English-centric. Non-English or heavily code-switched text will produce unreliable results with no explicit warning in v1.
- **Open question** — Should the conversation mode expose per-message score timelines as a chart in the frontend? Currently only the aggregate and pattern list are shown.

---

## 10. v2 Candidates

- **Empirical weight calibration** — Train indicator weights against a labelled deception corpus (e.g. Columbia-Deception Corpus) so they reflect measured predictive power rather than intuition.
- **Multi-language support** — Add language detection and route non-English text to an appropriate NLP pipeline.
- **Score timeline chart** — Visualise per-message scores across a conversation so story drift is visible at a glance.
- **Browser extension** — Analyse text in-page without opening the web UI.
- **Batch API** — Accept an array of texts in a single request for bulk analysis workflows.
