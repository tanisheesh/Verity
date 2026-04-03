'use client';

import { motion } from 'framer-motion';

const layers = [
  {
    number: '01',
    name: 'Tense Consistency',
    weight: '25%',
    description:
      'Verb phrases are extracted and tense mapped across every sentence. Unexplained shifts from past to present mid-narrative indicate the speaker is constructing rather than recalling events.',
  },
  {
    number: '02',
    name: 'Agent Deletion',
    weight: '15%',
    description:
      'Passive voice constructions remove the actor from sentences. When over 40% of sentences use passive voice, the speaker is likely avoiding ownership of their actions.',
  },
  {
    number: '03',
    name: 'Pronoun Consistency',
    weight: '10%',
    description:
      "Genuine personal accounts maintain consistent first-person narration. Dropping 'I' or shifting to 'we' signals psychological distancing from the described events.",
  },
  {
    number: '04',
    name: 'Lexical Diversity',
    weight: '12%',
    description:
      'Fabricated stories reuse a limited vocabulary. A Type-Token Ratio below 0.6 on texts of 30+ words suggests rehearsed or constructed language.',
  },
  {
    number: '05',
    name: 'Negation Clustering',
    weight: '15%',
    description:
      'Multiple negations in a single sentence reveal defensive thinking. Preemptive denials — denying things never accused — are a particularly strong deception signal.',
  },
  {
    number: '06',
    name: 'Narrative Structure',
    weight: '15%',
    description:
      'Truthful accounts have three parts: context before the event, the event itself, and aftermath. Missing prologue or epilogue suggests a fabricated account with no real memory to draw from.',
  },
  {
    number: '07',
    name: 'Information Density',
    weight: '10%',
    description:
      'Liars over-detail irrelevant parts while being vague about the central event. VERITY measures word distribution across narrative sections to detect this imbalance.',
  },
  {
    number: '08',
    name: 'Cognitive Load',
    weight: '12%',
    description:
      "Phrases like 'honestly' and 'to be frank' signal the opposite. Memory hedges and veracity emphasis words are catalogued and density measured per sentence.",
  },
  {
    number: '09',
    name: 'Contradiction Detection',
    weight: '15%',
    description:
      'Subject-verb pairs are extracted and compared across the entire text. Contradictory claims about the same subject are flagged automatically.',
  },
];

const limitations = [
  'VERITY does not verify facts. It analyzes HOW something is said, not WHAT is said.',
  'Rule-based analysis has limits. Subtle deception by practiced liars may score low.',
  'Context matters. Some linguistic patterns are cultural or stylistic, not deceptive.',
];

export default function HowItWorks() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[11px] tracking-[0.2em] mb-4"
          style={{ color: 'var(--accent)' }}
        >
          THE SCIENCE BEHIND VERITY
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[clamp(60px,8vw,100px)] leading-[0.9] mb-6"
          style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--text-primary)' }}
        >
          HOW IT WORKS
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-[16px] max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          9 forensic linguistic analysis layers running in parallel. No black box — every decision is explainable.
        </motion.p>
      </section>

      {/* Process Flow */}
      <section className="mb-20">
        <h2
          className="text-[11px] tracking-[0.2em] mb-12 uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          THE ANALYSIS PIPELINE
        </h2>
        <div className="space-y-12">
          {layers.map((layer, index) => (
            <motion.div
              key={layer.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`flex flex-col md:flex-row gap-6 items-start ${
                index % 2 === 0 ? '' : 'md:flex-row-reverse'
              }`}
            >
              <div
                className="text-[80px] leading-none flex-shrink-0"
                style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--text-muted)' }}
              >
                {layer.number}
              </div>
              <div
                className="flex-1 p-6 rounded-lg"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {layer.name}
                  </h3>
                  <span
                    className="text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                  >
                    Weight: {layer.weight}
                  </span>
                </div>
                <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                  {layer.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Scoring Section */}
      <section className="mb-20">
        <h2
          className="text-[11px] tracking-[0.2em] mb-8 uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          HOW SCORES ARE CALCULATED
        </h2>
        <div className="mb-6">
          <div className="h-12 rounded-lg overflow-hidden flex">
            <div className="flex-1 flex items-center justify-center text-[13px] font-semibold" style={{ background: '#00ff8820', color: '#00ff88' }}>
              LIKELY TRUTHFUL
            </div>
            <div className="flex-1 flex items-center justify-center text-[13px] font-semibold" style={{ background: '#ffaa0020', color: '#ffaa00' }}>
              UNCERTAIN
            </div>
            <div className="flex-1 flex items-center justify-center text-[13px] font-semibold" style={{ background: '#ff3b3b20', color: '#ff3b3b' }}>
              LIKELY DECEPTIVE
            </div>
          </div>
          <div className="flex justify-between text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
            <span>0</span>
            <span>33</span>
            <span>66</span>
            <span>100</span>
          </div>
        </div>
        <div
          className="p-5 rounded font-mono text-[13px]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--accent)' }}
        >
          <div>Each detected indicator contributes: Weight × Severity × 100</div>
          <div className="mt-2">Severity: Low = 0.33 | Medium = 0.66 | High = 1.0</div>
        </div>
      </section>

      {/* Limitations */}
      <section className="mb-20">
        <h2
          className="text-[11px] tracking-[0.2em] mb-8 uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          WHAT VERITY CANNOT DO
        </h2>
        <div className="space-y-4">
          {limitations.map((limitation, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-5 rounded"
              style={{
                background: 'var(--bg-card)',
                borderLeft: '3px solid var(--amber)',
              }}
            >
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {limitation}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Links Section */}
      <section className="text-center py-12">
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://verity-wfk0.onrender.com/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] transition-colors hover:text-[var(--text-primary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            📚 API Documentation
          </a>
          <span style={{ color: 'var(--border)' }}>•</span>
          <a
            href="https://github.com/tanisheesh/Verity"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] transition-colors hover:text-[var(--text-primary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            ⭐ GitHub Repository
          </a>
        </div>
      </section>
    </div>
  );
}
