// Layer 6: Narrative Structure Analysis
export interface NarrativeStructureAnalysis {
  hasPrologue: boolean;
  hasCoreEvent: boolean;
  hasEpilogue: boolean;
  missing: string[];
  prologueRange?: { start: number; end: number };
  coreEventRange?: { start: number; end: number };
  epilogueRange?: { start: number; end: number };
  isComplete: boolean;
}

// Layer 7: Information Density Distribution Analysis
export interface InformationDensityAnalysis {
  prologueWordCount: number;
  coreEventWordCount: number;
  epilogueWordCount: number;
  prologueDensity: number;
  coreEventDensity: number;
  epilogueDensity: number;
  hasImbalance: boolean;
  imbalanceDetails?: string;
}
