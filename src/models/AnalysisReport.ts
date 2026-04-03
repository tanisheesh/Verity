// New API format interfaces for 9-layer analysis system

export interface IndicatorDetail {
  name: string;
  severity: 'low' | 'medium' | 'high';
  weight: number;
  contribution: number;
  detail: string;
}

export interface SentenceFlag {
  sentence: string;
  index: number;
  flags: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface NarrativeStructureInfo {
  has_prologue: boolean;
  has_epilogue: boolean;
  missing: string[];
}

export interface AnalysisReport {
  score: number;
  confidence_interval: number;
  verdict: 'likely_truthful' | 'uncertain' | 'likely_lie';
  indicators: IndicatorDetail[];
  sentence_flags: SentenceFlag[];
  narrative_structure: NarrativeStructureInfo;
  summary: string;
}
