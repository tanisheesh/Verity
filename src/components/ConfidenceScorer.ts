import { ScoringInput, ScoringOutput, IndicatorWeights, IndicatorContribution } from '../models';
import { DeceptionIndicator } from '../models/DeceptionIndicator';

export class ConfidenceScorer {
  private readonly weights: IndicatorWeights = {
    tenseInconsistency: 0.25,
    narrativeStructure: 0.20,
    agentDeletion: 0.20,
    negationClustering: 0.15,
    informationDensity: 0.15,
    hedgeDensity: 0.12,
    lexicalDiversity: 0.12,
    pronounConsistency: 0.10
  };

  calculateScore(input: ScoringInput): ScoringOutput {
    const { indicators, textLength } = input;

    // Special case: no indicators detected
    if (indicators.length === 0) {
      return {
        score: 0,
        confidenceInterval: this.calculateConfidenceInterval(textLength),
        verdict: 'likely_truthful',
        indicatorContributions: []
      };
    }

    // Calculate weighted score with indicator contributions
    const contributions: IndicatorContribution[] = [];
    let totalScore = 0;

    indicators.forEach((indicator: DeceptionIndicator) => {
      const weight = this.getIndicatorWeight(indicator.type);
      const severityValue = this.mapSeverityToNumeric(indicator.severity);
      const contribution = weight * severityValue * 100;

      contributions.push({
        indicatorName: indicator.type,
        weight,
        severity: severityValue,
        contribution
      });

      totalScore += contribution;
    });

    // Cap total score at 100
    const finalScore = Math.min(100, totalScore);

    return {
      score: finalScore,
      confidenceInterval: this.calculateConfidenceInterval(textLength),
      verdict: this.getVerdict(finalScore),
      indicatorContributions: contributions
    };
  }

  calculateConfidenceInterval(textLength: number): number {
    // Formula: max(5, 20 - (textLength / 1000) * 2)
    // Longer texts = narrower interval (more reliable)
    // Shorter texts = wider interval (less reliable)
    const baseInterval = 20;
    const lengthFactor = (textLength / 1000) * 2;
    return Math.max(5, baseInterval - lengthFactor);
  }

  getVerdict(score: number): 'likely_truthful' | 'uncertain' | 'likely_lie' {
    if (score <= 33) {
      return 'likely_truthful';
    } else if (score <= 66) {
      return 'uncertain';
    } else {
      return 'likely_lie';
    }
  }

  private getIndicatorWeight(type: string): number {
    switch (type) {
      case 'tense_inconsistency':
        return this.weights.tenseInconsistency;
      case 'incomplete_narrative':
        return this.weights.narrativeStructure;
      case 'agent_deletion':
        return this.weights.agentDeletion;
      case 'negation_clustering':
        return this.weights.negationClustering;
      case 'information_density_mismatch':
        return this.weights.informationDensity;
      case 'cognitive_load_language':
        return this.weights.hedgeDensity;
      case 'low_lexical_diversity':
        return this.weights.lexicalDiversity;
      case 'pronoun_inconsistency':
        return this.weights.pronounConsistency;
      case 'contradiction_detection':
        return 0.15; // Weight for contradiction detection
      default:
        return 0.05; // Default weight for unknown indicators
    }
  }

  private mapSeverityToNumeric(severity: 'low' | 'medium' | 'high'): number {
    switch (severity) {
      case 'low':
        return 0.33;
      case 'medium':
        return 0.66;
      case 'high':
        return 1.0;
      default:
        return 0.33;
    }
  }

  getDefaultWeights(): IndicatorWeights {
    return { ...this.weights };
  }
}
