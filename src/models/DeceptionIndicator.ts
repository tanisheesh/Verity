export type IndicatorType =
  // New 9-layer analysis indicators
  | 'tense_inconsistency'
  | 'agent_deletion'
  | 'pronoun_inconsistency'
  | 'low_lexical_diversity'
  | 'negation_clustering'
  | 'incomplete_narrative'
  | 'information_density_mismatch'
  | 'cognitive_load_language'
  | 'contradiction_detection'
  // Legacy indicators (kept for backward compatibility)
  | 'tense_shift'
  | 'pronoun_distancing'
  | 'sentiment_anomaly'
  | 'over_explanation'
  | 'evasion_pattern'
  | 'entity_vagueness';

export interface TextLocation {
  sentenceIndex: number;
  startChar: number;
  endChar: number;
  text: string;
}

export interface DeceptionIndicator {
  id: string;
  name?: string; // Human-readable name for display
  type: IndicatorType;
  severity: 'low' | 'medium' | 'high';
  location: TextLocation;
  description: string;
  detail?: string; // Additional detail for new format
  evidence: string;
  weight: number;
  contribution?: number; // Calculated contribution to final score
}
