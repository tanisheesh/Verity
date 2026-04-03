'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const features = [
  {
    id: 'TS',
    title: 'Tense Shifts',
    description: 'Detects unexplained past/present tense changes that indicate fabricated narratives',
  },
  {
    id: 'AD',
    title: 'Agent Deletion',
    description: 'Identifies excessive passive voice used to avoid responsibility',
  },
  {
    id: 'PC',
    title: 'Pronoun Consistency',
    description: 'Tracks first-person pronoun shifts revealing psychological distancing',
  },
  {
    id: 'NL',
    title: 'Negation Clusters',
    description: 'Spots defensive negation patterns and preemptive denials',
  },
  {
    id: 'NS',
    title: 'Narrative Structure',
    description: 'Checks for missing context, core event, or aftermath in accounts',
  },
  {
    id: 'CL',
    title: 'Cognitive Load',
    description: 'Detects hedge words and veracity emphasis that signal deception',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-[40px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[11px] tracking-[0.2em] mb-4"
          style={{ color: 'var(--accent)' }}
        >
          LINGUISTIC DECEPTION ANALYSIS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-[clamp(80px,12vw,160px)] leading-[0.9] text-center"
          style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--text-primary)' }}
        >
          TRUTH LIVES
        </motion.h1>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-[clamp(80px,12vw,160px)] leading-[0.9] text-center ml-[clamp(20px,4vw,80px)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          <span style={{ color: 'var(--text-primary)' }}>IN </span>
          <span style={{ color: 'var(--accent)' }}>LANGUAGE.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-[18px] max-w-[480px] text-center mt-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          VERITY analyzes linguistic patterns to detect deception. No guesswork — just forensic NLP.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="flex gap-4 mt-10"
        >
          <Link
            href="/analyze"
            className="text-[15px] font-semibold px-7 py-3.5 rounded transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', color: '#080808' }}
          >
            Analyze Text →
          </Link>
          <Link
            href="/how-it-works"
            className="text-[15px] px-7 py-3.5 rounded transition-all hover:border-[var(--border-bright)] hover:text-[var(--text-primary)]"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-bright)',
              color: 'var(--text-secondary)',
            }}
          >
            How It Works
          </Link>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section
        className="py-8 mt-20"
        style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-[48px]" style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--accent)' }}>
              9
            </div>
            <div className="text-[12px] tracking-[0.1em] uppercase" style={{ color: 'var(--text-secondary)' }}>
              Analysis Layers
            </div>
          </div>
          <div>
            <div className="text-[48px]" style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--accent)' }}>
              100%
            </div>
            <div className="text-[12px] tracking-[0.1em] uppercase" style={{ color: 'var(--text-secondary)' }}>
              Rule-Based NLP
            </div>
          </div>
          <div>
            <div className="text-[48px]" style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--accent)' }}>
              &lt;500ms
            </div>
            <div className="text-[12px] tracking-[0.1em] uppercase" style={{ color: 'var(--text-secondary)' }}>
              Analysis Time
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-[11px] tracking-[0.2em] mb-8 uppercase" style={{ color: 'var(--text-muted)' }}>
          WHAT VERITY DETECTS
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="p-6 rounded-lg transition-all cursor-pointer"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="inline-block px-2.5 py-1.5 rounded text-[20px]"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  color: 'var(--accent)',
                  background: 'var(--accent-dim)',
                }}
              >
                {feature.id}
              </div>
              <h3 className="text-[15px] font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-20 px-4">
        <h2
          className="text-[56px] mb-4"
          style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--text-primary)' }}
        >
          Ready to find the truth?
        </h2>
        <p className="text-[16px] mb-8" style={{ color: 'var(--text-secondary)' }}>
          Paste any statement or conversation. Results in under 500ms.
        </p>
        <Link
          href="/analyze"
          className="inline-block text-[15px] font-semibold px-7 py-3.5 rounded transition-all hover:brightness-110"
          style={{ background: 'var(--accent)', color: '#080808' }}
        >
          Start Analyzing →
        </Link>
        
        {/* Links Section */}
        <div className="flex items-center justify-center gap-6 mt-12">
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
