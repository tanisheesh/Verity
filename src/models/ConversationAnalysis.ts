import { AnalysisReport } from './AnalysisReport';

export interface MessageAnalysis {
  messageIndex: number;
  text: string;
  report: AnalysisReport;
}

export interface CrossMessagePattern {
  type: 'story_inconsistency' | 'detail_contradiction' | 'timeline_mismatch';
  involvedMessages: number[];
  description: string;
}

export interface ConversationAnalysis {
  messages: MessageAnalysis[];
  aggregateScore: number;
  aggregateLevel: 'Low' | 'Medium' | 'High';
  crossMessagePatterns: CrossMessagePattern[];
  summary: string;
}
