<div align="center">

# 🔍 VERITY

### *Truth Lives in Language.*

**Forensic linguistic analysis powered by rule-based NLP**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Live Demo](https://verity-nlp.vercel.app) • [API Docs](https://verity-wfk0.onrender.com/api-docs) • [How It Works](https://verity-nlp.vercel.app/how-it-works)


</div>

## 💡 What Is This?

VERITY analyzes **how** people write to detect deception patterns. Not what they say — but how they say it.

- 🎯 **Single Message**: Get a deception score (0-100) with detailed indicators
- 💬 **Conversations**: Track story changes and contradictions across messages
- ⚡ **Fast**: Results in <500ms
- 🔬 **Explainable**: Every decision is documented and traceable

No black boxes. No machine learning. Just forensic linguistics.

 

## 🎯 What It Does

VERITY analyzes how people write and speak to identify linguistic patterns associated with deception. It doesn't verify facts — it analyzes **how** something is said, not **what** is said.

**Single Message Analysis**: Paste a statement, get a deception score (0-100) with detailed indicators.

**Conversation Analysis**: Analyze multi-message exchanges to detect story changes, timeline contradictions, and cross-message inconsistencies.

 

## 🧠 The 9 Analysis Layers

### 1. **Tense Consistency** (25% weight)
Tracks verb tenses across sentences. Unexplained shifts from past to present mid-narrative indicate construction rather than recall.

### 2. **Agent Deletion** (20% weight)
Detects excessive passive voice. When over 40% of sentences avoid naming the actor, the speaker is likely dodging responsibility.

### 3. **Pronoun Consistency** (10% weight)
Monitors first-person pronoun usage. Dropping "I" or shifting to "we" signals psychological distancing from events.

### 4. **Lexical Diversity** (12% weight)
Measures vocabulary richness using Type-Token Ratio. Fabricated stories reuse limited vocabulary (TTR < 0.6).

### 5. **Negation Clustering** (15% weight)
Identifies defensive negation patterns. Multiple negations per sentence reveal defensive thinking. Preemptive denials are particularly strong signals.

### 6. **Narrative Structure** (20% weight)
Checks for prologue (context before), core event, and epilogue (aftermath). Missing components suggest fabrication with no real memory.

### 7. **Information Density** (15% weight)
Analyzes word distribution across narrative sections. Liars over-detail irrelevant parts while being vague about central events.

### 8. **Cognitive Load Language** (12% weight)
Catalogs hedge words ("honestly", "to be frank") and memory qualifiers. High density indicates cognitive strain from fabrication.

### 9. **Contradiction Detection** (15% weight)
Extracts subject-verb pairs and compares them across the text. Flags contradictory claims about the same subject.

 

## 📊 How Scoring Works

```
Score = Σ (Weight × Severity × 100)
```

**Severity Levels**:
- Low = 0.33
- Medium = 0.66  
- High = 1.0

**Score Ranges**:
- **0-33**: Likely Truthful — Minimal deception indicators detected
- **34-59**: Inconsistent — Contradictions worth investigating
- **60-79**: Likely Deceptive — Multiple deception signals present
- **80-100**: Deceptive — Strong evidence of fabrication

Each indicator contributes to the final score based on its weight and severity. The system provides a confidence interval (±) to indicate scoring uncertainty.

 
## 🚀 Features

✅ **Real-time Analysis** — Results in under 500ms  
✅ **Explainable AI** — Every decision is traceable and documented  
✅ **Conversation Mode** — Detect story changes across multiple messages  
✅ **Developer Mode** — Toggle detailed technical breakdowns  
✅ **API Documentation** — Full Swagger UI at `/api-docs`  
✅ **100% Rule-Based** — No machine learning, no training data required  

 

## ⚠️ Limitations

**VERITY Cannot**:
- Verify factual accuracy — It analyzes linguistic patterns, not truth
- Detect all deception — Practiced liars may score low
- Replace human judgment — Context and culture matter

**Best Used For**:
- Initial screening of statements
- Identifying areas requiring deeper investigation
- Educational purposes and linguistic research
---

**Remember**: VERITY is a tool, not a verdict. Always combine automated analysis with human expertise and contextual understanding.
