// New API format interfaces
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

export interface ConversationAnalysis {
  messages: Array<{
    messageIndex: number;
    text: string;
    report: AnalysisReport;
  }>;
  aggregateScore: number;
  aggregateLevel: 'Low' | 'Medium' | 'High';
  crossMessagePatterns: Array<{
    type: string;
    involvedMessages: number[];
    messageIndices?: number[];
    description: string;
  }>;
  summary: string;
}

export interface ApiResponse {
  success: boolean;
  data?: AnalysisReport | ConversationAnalysis;
  error?: {
    code: string;
    message: string;
  };
}
