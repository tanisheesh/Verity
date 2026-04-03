'use client';

import { useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { analyzeText } from '../api-service';
import { AnalysisReport, ConversationAnalysis, SentenceFlag } from '../types';
import HighlightedText from '../components/HighlightedText';

const EXAMPLES = {
  truthful: "I went to the store at 3pm yesterday. I bought milk, bread, and eggs. The cashier was a young guy with glasses. I paid by card and came home by 3:45. Sarah called me when I was walking back.",
  deceptive: "I was at home the whole evening, I never left the house. My roommate can confirm I was there — well, actually he went out earlier but I was definitely home. I ordered food, it arrived around 8 or maybe 9, I'm not sure exactly. I don't know what you think you saw but it wasn't me.",
  conversation: "I was home all night, didn't go anywhere.\n\nWell I mean I stepped out briefly to get cigarettes but that's it.\n\nOkay fine I went to Rahul's place but only for like 20 minutes.\n\nI don't know why you're making such a big deal, I was basically home."
};

export default function AnalyzePage() {
  const [mode, setMode] = useState<'single' | 'conversation'>('single');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisReport | ConversationAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const response = await analyzeText(text, mode);
      if (response.success && response.data) {
        setResult(response.data);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (type: keyof typeof EXAMPLES) => {
    setText(EXAMPLES[type]);
    if (type === 'conversation') {
      setMode('conversation');
    } else {
      setMode('single');
    }
  };

  const charCount = text.length;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Left Panel - Input */}
      <motion.div
        className="w-full lg:w-[40%] lg:sticky lg:top-0 lg:self-start p-8"
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div 
          className="text-[12px] font-semibold tracking-[0.2em] mb-1" 
          style={{ color: 'var(--accent)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          VERITY
        </motion.div>
        <motion.div 
          className="text-[13px] mb-6" 
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Forensic Text Analysis
        </motion.div>

        {/* Mode Toggle */}
        <motion.div 
          className="flex mb-4 rounded overflow-hidden" 
          style={{ border: '1px solid var(--border)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <button
            onClick={() => setMode('single')}
            className="flex-1 py-2.5 text-[13px] font-semibold transition-all"
            style={{
              background: mode === 'single' ? 'var(--accent)' : 'var(--bg-card)',
              color: mode === 'single' ? '#080808' : 'var(--text-secondary)',
            }}
          >
            Single Message
          </button>
          <button
            onClick={() => setMode('conversation')}
            className="flex-1 py-2.5 text-[13px] font-semibold transition-all"
            style={{
              background: mode === 'conversation' ? 'var(--accent)' : 'var(--bg-card)',
              color: mode === 'conversation' ? '#080808' : 'var(--text-secondary)',
            }}
          >
            Conversation
          </button>
        </motion.div>

        {/* Textarea */}
        <motion.textarea
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            mode === 'single'
              ? 'Paste a statement or message to analyze...'
              : 'Paste a conversation export...\n\nFormat supported:\n• Each message on a new line\n• With timestamps: 10:30 PM: message\n• WhatsApp format: [9:15 AM] Name: message'
          }
          className="w-full min-h-[280px] p-4 rounded resize-vertical text-[14px] focus:outline-none transition-colors"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--border-bright)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          maxLength={10000}
        />
        <motion.div 
          className="text-right text-[11px] mt-1" 
          style={{ color: 'var(--text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {charCount} / 10,000
        </motion.div>

        {/* Analyze Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          onClick={handleAnalyze}
          disabled={!text.trim() || loading}
          className="w-full py-3.5 rounded text-[14px] font-bold tracking-[0.05em] mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
          style={{ background: 'var(--accent)', color: '#080808' }}
        >
          {loading ? 'ANALYZING...' : 'ANALYZE TEXT →'}
        </motion.button>

        {/* Example Prompts */}
        <motion.div 
          className="mt-5 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="text-[10px] tracking-[0.15em] mb-2" style={{ color: 'var(--text-muted)' }}>
            TRY AN EXAMPLE
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadExample('truthful')}
              className="text-[12px] px-3 py-1.5 rounded-full transition-all hover:border-[var(--border-bright)]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Truthful Account
            </button>
            <button
              onClick={() => loadExample('deceptive')}
              className="text-[12px] px-3 py-1.5 rounded-full transition-all hover:border-[var(--border-bright)]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Deceptive Alibi
            </button>
            <button
              onClick={() => loadExample('conversation')}
              className="text-[12px] px-3 py-1.5 rounded-full transition-all hover:border-[var(--border-bright)]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Conversation
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Panel - Results */}
      <motion.div 
        className="flex-1 p-8 overflow-y-auto" 
        style={{ background: 'var(--bg-primary)' }}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        {!result && !loading && <EmptyState />}
        {loading && <LoadingState />}
        {result && !loading && (
          'messages' in result ? (
            <ConversationResults data={result} />
          ) : (
            <SingleResults data={result} originalText={text} />
          )
        )}
      </motion.div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
    >
      <motion.div 
        className="text-[120px] leading-none mb-4" 
        style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--text-muted)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        V
      </motion.div>
      <motion.div 
        className="text-[14px]" 
        style={{ color: 'var(--text-muted)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        Submit text to begin analysis
      </motion.div>
    </motion.div>
  );
}

function LoadingState() {
  const layers = [
    'Tense Consistency',
    'Agent Deletion',
    'Pronoun Consistency',
    'Lexical Diversity',
    'Negation Clustering',
    'Narrative Structure',
    'Information Density',
    'Cognitive Load',
    'Contradiction Detection',
  ];

  return (
    <div className="space-y-3">
      {layers.map((layer, index) => (
        <motion.div
          key={layer}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-2 text-[14px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ●
          </motion.span>
          {layer}...
        </motion.div>
      ))}
    </div>
  );
}

function SingleResults({ data, originalText }: { data: AnalysisReport; originalText: string }) {
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const scoreColor =
    data.score <= 33 ? 'var(--accent)' : data.score <= 66 ? 'var(--amber)' : 'var(--red)';
  
  const verdictConfig = {
    likely_truthful: { 
      label: 'LIKELY TRUTHFUL', 
      bg: '#00ff8820', 
      color: '#00ff88', 
      border: '#00ff8840',
      description: 'This statement shows minimal deception indicators. The narrative structure is complete and language patterns appear consistent.'
    },
    uncertain: { 
      label: 'UNCERTAIN', 
      bg: '#ffaa0020', 
      color: '#ffaa00', 
      border: '#ffaa0040',
      description: `This statement shows some concerning patterns but is inconclusive. ${data.indicators.length} indicator${data.indicators.length !== 1 ? 's' : ''} detected. Further context may be needed.`
    },
    likely_lie: { 
      label: 'LIKELY DECEPTIVE', 
      bg: '#ff3b3b20', 
      color: '#ff3b3b', 
      border: '#ff3b3b40',
      description: 'Multiple deception signals detected. The statement contains significant inconsistencies and suspicious language patterns.'
    },
  };

  const verdict = verdictConfig[data.verdict];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Developer Mode Toggle */}
      <motion.div 
        className="flex items-center justify-end gap-2 mb-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          DEVELOPER MODE
        </span>
        <button
          onClick={() => setShowDeveloperMode(!showDeveloperMode)}
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{
            background: showDeveloperMode ? 'var(--accent)' : 'var(--border)',
          }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{
              transform: showDeveloperMode ? 'translateX(22px)' : 'translateX(2px)',
            }}
          />
        </button>
      </motion.div>

      {/* BIG VERDICT CARD */}
      <motion.div
        className="p-6 rounded-lg mb-8"
        style={{
          background: verdict.bg,
          border: `2px solid ${verdict.border}`,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div
          className="text-[48px] leading-none mb-3"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: verdict.color,
            letterSpacing: '0.05em',
          }}
        >
          {verdict.label}
        </div>
        <p className="text-[15px] mb-3" style={{ color: 'var(--text-primary)' }}>
          {verdict.description}
        </p>
        <div className="text-[13px]" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
          Deception score: {data.score.toFixed(1)}/100
        </div>
        
        {/* Developer Mode: Show detailed score info */}
        {showDeveloperMode && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
              Confidence Interval: ±{data.confidence_interval.toFixed(2)}
            </div>
            <p className="text-[13px] italic" style={{ color: 'var(--text-secondary)' }}>
              {data.summary}
            </p>
          </div>
        )}
      </motion.div>

      {showDeveloperMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-px my-6" style={{ background: 'var(--border)' }} />

          {/* Indicators */}
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
              DETECTED INDICATORS ({data.indicators.length})
            </div>
            <div className="space-y-2">
              {data.indicators.map((indicator, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-md"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {indicator.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold px-2 py-1 rounded uppercase"
                        style={{
                          background: indicator.severity === 'high' ? '#ff3b3b20' : indicator.severity === 'medium' ? '#ff6b0020' : '#ffaa0020',
                          color: indicator.severity === 'high' ? 'var(--red)' : indicator.severity === 'medium' ? '#ff6b00' : 'var(--amber)',
                        }}
                      >
                        {indicator.severity}
                      </span>
                      <span
                        className="text-[20px]"
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          color: indicator.severity === 'high' ? 'var(--red)' : indicator.severity === 'medium' ? '#ff6b00' : 'var(--amber)',
                        }}
                      >
                        +{indicator.contribution.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    {indicator.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Narrative Structure */}
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
              NARRATIVE STRUCTURE
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div
                className="p-3 rounded-md text-center"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="text-[24px] mb-1" style={{ color: data.narrative_structure.has_prologue ? 'var(--accent)' : 'var(--red)' }}>
                  {data.narrative_structure.has_prologue ? '✓' : '✗'}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>PROLOGUE</div>
              </div>
              <div
                className="p-3 rounded-md text-center"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="text-[24px] mb-1" style={{ color: 'var(--accent)' }}>✓</div>
                <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>CORE EVENT</div>
              </div>
              <div
                className="p-3 rounded-md text-center"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="text-[24px] mb-1" style={{ color: data.narrative_structure.has_epilogue ? 'var(--accent)' : 'var(--red)' }}>
                  {data.narrative_structure.has_epilogue ? '✓' : '✗'}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>EPILOGUE</div>
              </div>
            </div>
          </div>

          {/* Flagged Sentences */}
          {data.sentence_flags.length > 0 && (
            <div className="mb-8">
              <div className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
                FLAGGED SENTENCES ({data.sentence_flags.length})
              </div>
              <div className="space-y-2">
                {data.sentence_flags.map((flag, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-r"
                    style={{
                      background: flag.severity === 'high' ? '#ff3b3b10' : flag.severity === 'medium' ? '#ff6b0010' : '#ffaa0010',
                      borderLeft: `3px solid ${flag.severity === 'high' ? 'var(--red)' : flag.severity === 'medium' ? '#ff6b00' : 'var(--amber)'}`,
                    }}
                  >
                    <p className="text-[14px] mb-2" style={{ color: 'var(--text-primary)' }}>
                      {flag.sentence}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {flag.flags.map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlighted Text */}
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
              TEXT ANALYSIS
            </div>
            <HighlightedText text={originalText} flags={data.sentence_flags} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function ConversationResults({ data }: { data: ConversationAnalysis }) {
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const score = data.aggregateScore;
  
  // Determine verdict based on score
  const getVerdict = (score: number) => {
    if (score <= 33) return {
      label: 'LIKELY TRUTHFUL',
      color: 'var(--accent)',
      bg: '#00ff8820',
      border: '#00ff8840',
      description: 'The account appears consistent and credible.'
    };
    if (score <= 59) return {
      label: 'INCONSISTENT',
      color: 'var(--amber)',
      bg: '#ffaa0020',
      border: '#ffaa0040',
      description: 'The account contains contradictions worth investigating.'
    };
    if (score <= 79) return {
      label: 'LIKELY DECEPTIVE',
      color: '#ff6b00',
      bg: '#ff6b0020',
      border: '#ff6b0040',
      description: 'Multiple deception signals detected across messages.'
    };
    return {
      label: 'DECEPTIVE',
      color: 'var(--red)',
      bg: '#ff3b3b20',
      border: '#ff3b3b40',
      description: 'Strong evidence of fabrication and contradiction.'
    };
  };

  const verdict = getVerdict(score);

  // Pattern type to plain English
  const patternLabels: Record<string, string> = {
    timeline_mismatch: 'Timeline Contradiction',
    story_inconsistency: 'Story Changed',
    detail_contradiction: 'Conflicting Details',
    story_contradiction: 'Direct Contradiction',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Developer Mode Toggle */}
      <motion.div 
        className="flex items-center justify-end gap-2 mb-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          DEVELOPER MODE
        </span>
        <button
          onClick={() => setShowDeveloperMode(!showDeveloperMode)}
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{
            background: showDeveloperMode ? 'var(--accent)' : 'var(--border)',
          }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{
              transform: showDeveloperMode ? 'translateX(22px)' : 'translateX(2px)',
            }}
          />
        </button>
      </motion.div>

      {/* SECTION 1 - BIG VERDICT */}
      <motion.div
        className="p-6 rounded-lg mb-8"
        style={{
          background: verdict.bg,
          border: `2px solid ${verdict.border}`,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div
          className="text-[48px] leading-none mb-3"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: verdict.color,
            letterSpacing: '0.05em',
          }}
        >
          {verdict.label}
        </div>
        <p className="text-[15px] mb-3" style={{ color: 'var(--text-primary)' }}>
          {verdict.description}
        </p>
        <div className="text-[13px]" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
          Deception score: {score.toFixed(1)}/100
        </div>
        
        {/* Developer Mode: Show aggregate level and summary */}
        {showDeveloperMode && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
              Aggregate Level: {data.aggregateLevel}
            </div>
            <p className="text-[13px] italic" style={{ color: 'var(--text-secondary)' }}>
              {data.summary}
            </p>
          </div>
        )}
      </motion.div>

      {/* SECTION 2 - KEY FINDINGS */}
      {data.crossMessagePatterns.length > 0 && (
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
            KEY FINDINGS ({data.crossMessagePatterns.length})
          </div>
          <div className="space-y-3">
            {data.crossMessagePatterns.map((pattern, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${score > 59 ? 'var(--red)' : 'var(--amber)'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-[20px] mt-0.5" style={{ color: score > 59 ? 'var(--red)' : 'var(--amber)' }}>
                    ⚠
                  </span>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {patternLabels[pattern.type] || pattern.type.replace(/_/g, ' ')}
                    </div>
                    <p className="text-[13px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {pattern.description}
                    </p>
                    {pattern.messageIndices && pattern.messageIndices.length > 0 && (
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Messages {pattern.messageIndices.map(i => i + 1).join(' & ')}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* SECTION 3 - MESSAGE BREAKDOWN */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
          MESSAGE BREAKDOWN ({data.messages.length})
        </div>
        <div className="space-y-4">
          {data.messages.map((msg, idx) => {
            const msgScore = msg.report.score;
            const msgColor = msgScore <= 33 ? 'var(--accent)' : msgScore <= 59 ? 'var(--amber)' : msgScore <= 79 ? '#ff6b00' : 'var(--red)';
            
            // Strip timestamp if present
            const cleanText = msg.text.replace(/^(\[?\d{1,2}:\d{2}\s?[AP]M\]?:?\s?|\d{1,2}:\d{2}\s?[AP]M:?\s?)/, '');
            
            // Get top 2 indicators
            const topIndicators = msg.report.indicators.slice(0, 2);

            return (
              <motion.div
                key={msg.messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    MESSAGE {msg.messageIndex + 1}
                  </span>
                  {!showDeveloperMode && topIndicators.map((ind, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: ind.severity === 'high' ? '#ff3b3b20' : ind.severity === 'medium' ? '#ff6b0020' : '#ffaa0020',
                        color: ind.severity === 'high' ? 'var(--red)' : ind.severity === 'medium' ? '#ff6b00' : 'var(--amber)',
                      }}
                    >
                      {ind.name.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                
                <p className="text-[14px] mb-3" style={{ color: 'var(--text-primary)' }}>
                  "{cleanText}"
                </p>

                {/* Score bar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${msgScore}%`,
                        background: msgColor,
                      }}
                    />
                  </div>
                  <span className="text-[14px] font-semibold min-w-[40px] text-right" style={{ color: msgColor }}>
                    {msgScore.toFixed(0)}
                  </span>
                </div>

                {/* Developer Mode: Show all details */}
                {showDeveloperMode && (
                  <div className="space-y-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    {/* Verdict and Confidence */}
                    <div>
                      <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                        VERDICT & CONFIDENCE
                      </div>
                      <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                        {msg.report.verdict.replace(/_/g, ' ').toUpperCase()} (±{msg.report.confidence_interval})
                      </div>
                    </div>

                    {/* All Indicators */}
                    {msg.report.indicators.length > 0 && (
                      <div>
                        <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                          DETECTED INDICATORS
                        </div>
                        <div className="space-y-2">
                          {msg.report.indicators.map((ind, i) => (
                            <div
                              key={i}
                              className="p-3 rounded"
                              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {ind.name.replace(/_/g, ' ')}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase"
                                    style={{
                                      background: ind.severity === 'high' ? '#ff3b3b20' : ind.severity === 'medium' ? '#ff6b0020' : '#ffaa0020',
                                      color: ind.severity === 'high' ? 'var(--red)' : ind.severity === 'medium' ? '#ff6b00' : 'var(--amber)',
                                    }}
                                  >
                                    {ind.severity}
                                  </span>
                                  <span
                                    className="text-[16px]"
                                    style={{
                                      fontFamily: "'Bebas Neue', sans-serif",
                                      color: ind.severity === 'high' ? 'var(--red)' : ind.severity === 'medium' ? '#ff6b00' : 'var(--amber)',
                                    }}
                                  >
                                    +{ind.contribution.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                {ind.detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Narrative Structure */}
                    {msg.report.narrative_structure && (
                      <div>
                        <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                          NARRATIVE STRUCTURE
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div
                            className="p-2 rounded text-center"
                            style={{ border: '1px solid var(--border)' }}
                          >
                            <div className="text-[20px] mb-1" style={{ color: msg.report.narrative_structure.has_prologue ? 'var(--accent)' : 'var(--red)' }}>
                              {msg.report.narrative_structure.has_prologue ? '✓' : '✗'}
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>PROLOGUE</div>
                          </div>
                          <div
                            className="p-2 rounded text-center"
                            style={{ border: '1px solid var(--border)' }}
                          >
                            <div className="text-[20px] mb-1" style={{ color: 'var(--accent)' }}>✓</div>
                            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>CORE</div>
                          </div>
                          <div
                            className="p-2 rounded text-center"
                            style={{ border: '1px solid var(--border)' }}
                          >
                            <div className="text-[20px] mb-1" style={{ color: msg.report.narrative_structure.has_epilogue ? 'var(--accent)' : 'var(--red)' }}>
                              {msg.report.narrative_structure.has_epilogue ? '✓' : '✗'}
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>EPILOGUE</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Flagged Sentences */}
                    {msg.report.sentence_flags.length > 0 && (
                      <div>
                        <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                          FLAGGED SENTENCES
                        </div>
                        <div className="space-y-2">
                          {msg.report.sentence_flags.map((flag, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-r"
                              style={{
                                background: flag.severity === 'high' ? '#ff3b3b10' : flag.severity === 'medium' ? '#ff6b0010' : '#ffaa0010',
                                borderLeft: `3px solid ${flag.severity === 'high' ? 'var(--red)' : flag.severity === 'medium' ? '#ff6b00' : 'var(--amber)'}`,
                              }}
                            >
                              <p className="text-[12px] mb-1" style={{ color: 'var(--text-primary)' }}>
                                {flag.sentence}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {flag.flags.map((f, j) => (
                                  <span
                                    key={j}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div>
                      <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                        SUMMARY
                      </div>
                      <p className="text-[13px] italic" style={{ color: 'var(--text-secondary)' }}>
                        {msg.report.summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Simple mode: Show collapsible details */}
                {!showDeveloperMode && msg.report.indicators.length > 2 && (
                  <details className="mt-3">
                    <summary className="text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                      Show all indicators ({msg.report.indicators.length})
                    </summary>
                    <div className="mt-2 space-y-2">
                      {msg.report.indicators.map((ind, i) => (
                        <div
                          key={i}
                          className="text-[12px] p-2 rounded"
                          style={{ background: 'var(--bg-secondary)' }}
                        >
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {ind.name.replace(/_/g, ' ')}
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            {ind.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnimatedScore({ score, color }: { score: number; color: string }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 1000 });
  const [displayScore, setDisplayScore] = useState(0);

  useState(() => {
    motionValue.set(score);
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayScore(Math.round(latest));
    });
    return unsubscribe;
  });

  return (
    <span className="text-[96px] leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", color }}>
      {displayScore}
    </span>
  );
}
