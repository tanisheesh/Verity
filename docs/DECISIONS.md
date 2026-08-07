# Engineering Decisions — VERITY

<!--
This is not user documentation. This is for technical interviewers
and senior engineers who want to understand WHY the system is built
the way it is. Every entry answers a question an interviewer might ask.
-->

---

## Decision 1 — Rule-based NLP over an LLM

**Context:** Deception detection could be implemented by sending text to Claude or GPT and asking "is this deceptive?" That would be faster to build and might produce plausible-sounding results. The options were: (a) LLM prompt, (b) fine-tuned classifier, (c) deterministic rule-based NLP.

**Decision:** Fully rule-based. No LLM calls, no ML model, no training data.

**Reason:** The core product promise is explainability — every score must be traceable to a specific sentence and a documented heuristic. An LLM produces a verdict without an auditable chain of evidence; a trained classifier is a black box with accuracy claims but no per-instance explanation. Rule-based NLP makes every decision inspectable. It also eliminates API costs, rate limits, nondeterminism, and the need to share user text with a third party.

**Tradeoff:** The indicator weights (e.g. tense consistency = 0.25) are manually tuned constants, not learned from data. Real-world precision/recall is unknown without a labelled evaluation corpus. A v1 system built on rules can be wrong in ways that a calibrated classifier would catch.

---

## Decision 2 — compromise over spaCy / Stanford NLP / a Python stack

**Context:** Most production NLP systems are Python-first. spaCy, NLTK, and Stanford CoreNLP offer richer linguistic annotation. The question was whether to build the backend in Python (where NLP tooling is best) or stay in Node.js with JavaScript-native libraries.

**Decision:** Node.js backend using compromise (POS tagging, entity extraction) and natural (tokenisation, stemming).

**Reason:** compromise runs natively in Node.js with zero native binaries, zero model downloads, and cold-start in milliseconds. For the specific analyses VERITY needs — passive voice detection, pronoun tagging, verb tense extraction — compromise is adequate. Keeping the entire system in TypeScript eliminates the context switch between languages and the operational overhead of managing a Python service alongside a Node.js server.

**Tradeoff:** compromise's linguistic accuracy is lower than spaCy for edge cases. Passive voice detection is heuristic (pattern matching on auxiliary verbs + past participles) rather than a full dependency parse. Some passive constructions will be missed; some active constructions may be misclassified.

---

## Decision 3 — Stateless API (no database)

**Context:** Options were: (a) store every analysis result for history/comparison, (b) store anonymised results for future ML training, (c) stateless — nothing persisted.

**Decision:** Fully stateless. No database, no persistent storage of any kind.

**Reason:** The analysis task is purely computational — text in, JSON out. There is no use case in v1 that requires accessing a previous result. Eliminating the database removes an entire infrastructure dependency, a whole class of security concerns (no user data at rest), and deployment complexity. The backend deploys as a single Node.js process with no migration step.

**Tradeoff:** Users cannot retrieve past analyses. Repeat requests re-run the full NLP pipeline rather than hitting a cache. For a research or investigative workflow, history could be valuable — that is a deliberate v2 deferral.

---

## Decision 4 — Recency-weighted aggregate scoring for conversations

**Context:** When analysing a multi-message conversation, the naive approach is to average the per-message scores. But in a real deceptive conversation, later messages often have more deception signals as the story is challenged and revised.

**Decision:** Weight message scores as `1 + (i / n) × 0.5`, giving the last message 1.5× the weight of the first. Add up to +35 bonus points for detected cross-message patterns (story inconsistencies, timeline mismatches, detail contradictions).

**Reason:** Recency weighting reflects the forensic-linguistics observation that story revision under pressure produces stronger deception signals than the initial statement. The pattern bonus ensures that cross-message contradictions — which are strong evidence of fabrication — have a meaningful impact on the final score even when individual messages score modestly.

**Tradeoff:** The weighting constants (0.5 slope, 16 points per pattern, 35 point cap) are manually chosen and not empirically validated. In a conversation where the speaker genuinely reclarifies truthful details (rather than revising a lie), later messages may be unfairly penalised.

---

## Decision 5 — Open CORS with rate limiting rather than API key auth

**Context:** The API is intended to be publicly usable. Options were: (a) require API key registration, (b) open CORS with rate limiting, (c) frontend-only (no public API).

**Decision:** Open CORS (`origin: '*'`) with `express-rate-limit` — 100 requests per IP per 15-minute window.

**Reason:** The goal is developer accessibility and portfolio discoverability. Requiring API key registration adds friction and a user-management surface. Since every analysis is stateless and costs zero per request (no LLM calls, no paid services), the main abuse risk is compute exhaustion, which rate limiting addresses. There is no user data to protect.

**Tradeoff:** IP-based rate limiting is easily bypassed with proxies or rotating IPs. For a v1 portfolio project this is an acceptable risk; a production system would need token-based auth with per-user quotas.

---

## What I'd do differently in v2

- **Empirical weight calibration** — Run the indicator pipeline against a labelled deception corpus (e.g. Columbia-Deception Corpus or Microtask-Deceit Dataset), compute precision/recall per indicator, and replace the manually tuned weights with statistically derived values. The current weights are defensible starting points, not validated constants.
- **Dependency parse for passive voice** — Replace the heuristic `auxiliary + past-participle` pattern matching in `SyntaxParser` with a full dependency parse (compromise's `match` API or a lightweight model) to reduce false positives on stative constructions like "was born" or "was interested".
- **Per-session analysis history (client-side)** — Store analysis results in `localStorage` so users can compare multiple runs without a backend database. Preserves statelessness while adding practical value.

---

## Explicit non-decisions (deferred to v2)

| Feature | Why deferred |
|---|---|
| ML-based scoring | Requires a labelled ground-truth corpus to train against; rule-based is sufficient to ship and demonstrate explainability |
| Multi-language support | compromise and natural are English-only; supporting other languages requires a separate NLP pipeline per language |
| User accounts / history | No v1 use case requires persistence; adds infrastructure and data-retention complexity without clear benefit at this scale |
| Webhook / push notifications | Analyses complete synchronously in <500 ms; async delivery adds complexity with no user benefit |
| Batch analysis endpoint | Not needed for the interactive demo use case; straightforward to add when a real bulk-analysis consumer appears |
