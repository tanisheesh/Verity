// Syntax Parser Analysis Types

// Layer 1: Tense Consistency Analysis
export interface VerbPhrase {
  text: string;
  tense: 'past' | 'present' | 'future';
  sentenceIndex: number;
  isQuoted: boolean;
}

export interface TenseShift {
  fromSentence: number;
  toSentence: number;
  fromTense: string;
  toTense: string;
  isJustified: boolean;
}

export interface TenseConsistencyAnalysis {
  verbPhrases: VerbPhrase[];
  tenseShifts: TenseShift[];
  shiftCount: number;
  inconsistentSentences: number[];
}

// Layer 2: Agent Deletion Detection
export interface AgentDeletionAnalysis {
  passiveSentences: number[];
  passiveCount: number;
  totalSentences: number;
  passivePercentage: number;
  isExcessive: boolean;
}

// Layer 3: Pronoun Consistency Analysis
export interface PronounOccurrence {
  pronoun: string;
  sentenceIndex: number;
  type: 'singular' | 'plural';
  category?: string;
}

export interface PronounShift {
  fromSentence: number;
  toSentence: number;
  fromType: string;
  toType: string;
  fromCategory?: string;
  toCategory?: string;
}

export interface PronounConsistencyAnalysis {
  firstPersonPronouns: PronounOccurrence[];
  pronounCount: number;
  hasShifts: boolean;
  shifts: PronounShift[];
  isInconclusive: boolean;
  pronounOccurrences?: PronounOccurrence[];
  pronounShifts?: PronounShift[];
}

// Legacy types (kept for backward compatibility during migration)
export interface PronounAnalysis {
  firstPerson: string[];
  thirdPerson: string[];
  ratio: number;
  isDistancing: boolean;
}

export interface TenseAnalysis {
  tenseShifts: TenseShift[];
  inconsistentSentences: number[];
}

export interface NamedEntity {
  text: string;
  type: 'person' | 'place' | 'organization';
  frequency: number;
}

export interface EntityInconsistency {
  entity: string;
  variations: string[];
  locations: number[];
}

export interface EntityAnalysis {
  entities: NamedEntity[];
  density: number;
  inconsistentReferences: EntityInconsistency[];
}

export interface PassiveVoiceAnalysis {
  passiveSentences: number[];
  passivePercentage: number;
}

// Sentiment Analyzer Types
export interface SentenceSentiment {
  sentenceIndex: number;
  text: string;
  polarity: number;
}

export interface SentimentShift {
  fromSentence: number;
  toSentence: number;
  magnitude: number;
}

export interface ContextMismatch {
  sentenceIndex: number;
  expectedSentiment: 'positive' | 'negative';
  actualPolarity: number;
  reason: string;
}

export interface SentimentAnalysis {
  overallPolarity: number;
  sentenceScores: SentenceSentiment[];
  shifts: SentimentShift[];
  contextMismatches: ContextMismatch[];
}

// Heuristic Engine Types

// Layer 4: Lexical Diversity (Type-Token Ratio)
export interface LexicalDiversityAnalysis {
  totalWords: number;
  uniqueWords: number;
  typeTokenRatio: number;
  isLowDiversity: boolean;
  stopWordsExcluded: number;
}

// Layer 5: Negation Clustering Detection
export interface NegationOccurrence {
  word: string;
  sentenceIndex: number;
  isPreemptive: boolean;
}

export interface NegationClusteringAnalysis {
  negationWords: NegationOccurrence[];
  totalNegations: number;
  sentenceCount: number;
  negationDensity: number;
  clusteredSentences: number[];
  preemptiveNegations: number[];
}

// Layer 8: Cognitive Load Language Detection
export interface HedgeOccurrence {
  phrase: string;
  sentenceIndex: number;
  category: 'memory' | 'probability' | 'distancing' | 'veracity';
}

export interface CognitiveLoadAnalysis {
  memoryHedges: HedgeOccurrence[];
  probabilityHedges: HedgeOccurrence[];
  distancingLanguage: HedgeOccurrence[];
  veracityEmphasis: HedgeOccurrence[];
  totalHedges: number;
  hedgeDensity: number;
  isExcessive: boolean;
}

// Legacy types (kept for backward compatibility during migration)
export interface DetailMatch {
  text: string;
  location: number;
  type: 'time' | 'number' | 'context';
}

export interface OverExplanationIndicators {
  longSentences: number[];
  qualifierCount: number;
  unnecessaryDetails: DetailMatch[];
}

export interface PhraseMatch {
  phrase: string;
  location: number;
  sentenceIndex: number;
}

export interface EvasionIndicators {
  unansweredQuestions: number[];
  hedgingPhrases: PhraseMatch[];
  negationPhrases: PhraseMatch[];
  passiveVoiceUsage: number;
}

export interface HeuristicAnalysis {
  overExplanation: OverExplanationIndicators;
  evasionPatterns: EvasionIndicators;
}
