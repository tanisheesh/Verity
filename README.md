<p align="center">
  <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#080808"/>
    <path d="M8 8L16 24L24 8" stroke="#00FF88" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</p>

<h1 align="center">VERITY</h1>

<p align="center">
  <strong>Forensic linguistic analysis that scores any text for deception patterns — 9 rule-based NLP layers, no machine learning, results in under 500 ms.</strong>
</p>

<p align="center">
  <a href="https://verity-nlp.vercel.app">
    <img src="https://img.shields.io/badge/live_demo-00FF88-00FF88?style=flat-square" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/license-GPL--3.0-00FF88?style=flat-square" alt="License">
</p>

---

<p align="center">
  <img src="docs/assets/demo.gif" alt="VERITY demo" width="700">
</p>

---

## What is VERITY?

VERITY analyzes **how** people write to surface deception patterns — not what they claim, but how they say it. It applies nine forensic-linguistics heuristics (tense consistency, agent deletion, pronoun distancing, negation clustering, narrative structure, and more) to produce an explainable 0–100 deception score with a confidence interval. Unlike black-box ML classifiers, every indicator VERITY flags is traceable to a specific sentence and a documented rule. The tool works on single statements and on multi-message conversations, detecting story drift and timeline contradictions across messages.

> **Live demo →** [verity-nlp.vercel.app](https://verity-nlp.vercel.app)  
> **API docs →** [verity-wfk0.onrender.com/api-docs](https://verity-wfk0.onrender.com/api-docs)

---

## What you get

- **9-layer NLP pipeline** — tense shifts, passive-voice overuse, pronoun distancing, lexical poverty, negation clusters, narrative gaps, information-density imbalance, cognitive-load language, and contradiction detection all scored and weighted into one number
- **Conversation mode** — paste a multi-message exchange; VERITY scores each message individually, then applies recency-weighted aggregation and cross-message pattern detection (story inconsistencies, timeline mismatches, detail contradictions)
- **Fully explainable output** — every indicator lists its weight, severity, contributing sentence, and plain-English description; no verdict without evidence
- **Zero ML, zero data retention** — purely deterministic rule-based NLP using compromise and natural; stateless API, nothing stored server-side

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Framer Motion |
| Backend | Node.js · Express 5 · TypeScript |
| NLP | compromise 14 · natural 8 |
| API Docs | Swagger UI (swagger-jsdoc + swagger-ui-express) |
| Security | helmet · express-rate-limit · CORS |
| Hosting | Vercel (frontend) · Render (backend) |

---

## Engineering Decisions

**Why rule-based NLP over an LLM?**
Every score is fully auditable — trace any flag back to a specific sentence and a documented heuristic. An LLM would make the system opaque and introduce nondeterminism, which defeats the "explainable" promise.

**Why compromise over spaCy or a heavier NLP stack?**
compromise runs natively in Node.js with zero Python dependency. It's fast enough for <500 ms targets and covers the POS tagging and entity extraction this system needs without requiring a model download or a separate service.

**Why stateless (no database)?**
The analysis task is purely computational — text in, scores out. Storing nothing simplifies deployment, eliminates a whole attack surface, and means the backend scales horizontally with no coordination.

**What would you do differently in v2?**
Add confidence calibration against a labelled ground-truth corpus so the weight constants are empirically derived rather than manually tuned. The current weights are reasonable starting points, but they're not validated against real deception data.

---

## Docs

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements — goals, user stories, non-goals |
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, component breakdown |
| [Decisions](docs/DECISIONS.md) | Every major technical decision and why |
| [Setup](docs/SETUP.md) | Local dev setup, env vars, deployment |

---

## Author

**Tanish Poddar** — [tanisheesh.in](https://tanisheesh.in) · [LinkedIn](https://linkedin.com/in/tanisheesh) · [GitHub](https://github.com/tanisheesh)
