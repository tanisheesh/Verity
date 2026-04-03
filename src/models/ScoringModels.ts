import { DeceptionIndicator } from './DeceptionIndicator';

export interface IndicatorWeights {
  tenseInconsistency: 0.25;
  narrativeStructure: 0.20;
  agentDeletion: 0.20;
  negationClustering: 0.15;
  informationDensity: 0.15;
  hedgeDensity: 0.12;
  lexicalDiversity: 0.12;
  pronounConsistency: 0.10;
}

export interface ScoringInput {
  indicators: DeceptionIndicator[];
  textLength: number;
}

export interface ScoringOutput {
  score: number; // 0-100
  confidenceInterval: number;
  verdict: 'likely_truthful' | 'uncertain' | 'likely_lie';
  indicatorContributions: IndicatorContribution[];
}

export interface IndicatorContribution {
  indicatorName: string;
  weight: number;
  severity: number; // 0-1
  contribution: number; // weight × severity × 100
}
