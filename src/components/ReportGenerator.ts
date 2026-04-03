import {
  AnalysisReport,
  IndicatorDetail,
  SentenceFlag,
  NarrativeStructureInfo,
  NarrativeStructureAnalysis
} from '../models';
import { DeceptionIndicator } from '../models/DeceptionIndicator';

export interface ReportInput {
  text: string;
  score: number;
  confidenceInterval: number;
  verdict: 'likely_truthful' | 'uncertain' | 'likely_lie';
  indicators: DeceptionIndicator[];
  narrativeStructure?: NarrativeStructureAnalysis;
}

export class ReportGenerator {
  generateReport(input: ReportInput): AnalysisReport {
    const {
      score,
      confidenceInterval,
      verdict,
      indicators,
      narrativeStructure
    } = input;

    // Build indicators array
    const indicatorDetails: IndicatorDetail[] = indicators.map(ind => ({
      name: this.formatIndicatorName(ind.type),
      severity: ind.severity,
      weight: ind.weight,
      contribution: ind.weight * this.severityToNumeric(ind.severity) * 100,
      detail: ind.description
    }));

    // Build sentence_flags array by grouping indicators by sentence
    const sentenceFlagsMap = new Map<number, { sentence: string; flags: string[]; maxSeverity: 'low' | 'medium' | 'high' }>();
    
    // Split input text into sentences for reference
    const inputSentences = input.text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    indicators.forEach(ind => {
      const sentenceIdx = ind.location.sentenceIndex;
      const sentenceText = ind.location.text || (inputSentences[sentenceIdx] || '');
      const flagName = this.formatIndicatorName(ind.type);
      
      if (!sentenceFlagsMap.has(sentenceIdx)) {
        sentenceFlagsMap.set(sentenceIdx, {
          sentence: sentenceText,
          flags: [],
          maxSeverity: ind.severity
        });
      }
      
      const entry = sentenceFlagsMap.get(sentenceIdx)!;
      entry.flags.push(flagName);
      
      // Update max severity
      if (this.severityToNumeric(ind.severity) > this.severityToNumeric(entry.maxSeverity)) {
        entry.maxSeverity = ind.severity;
      }
    });

    const sentenceFlags: SentenceFlag[] = Array.from(sentenceFlagsMap.entries()).map(([index, data]) => ({
      sentence: data.sentence,
      index,
      flags: data.flags,
      severity: data.maxSeverity
    }));

    // Build narrative_structure object
    const narrativeStructureInfo: NarrativeStructureInfo = narrativeStructure ? {
      has_prologue: narrativeStructure.hasPrologue,
      has_epilogue: narrativeStructure.hasEpilogue,
      missing: narrativeStructure.missing
    } : {
      has_prologue: false,
      has_epilogue: false,
      missing: ['prologue', 'epilogue']
    };

    // Generate summary (will be implemented in subtask 1.5)
    const summary = this.generateSummary(verdict, indicatorDetails, narrativeStructureInfo);

    return {
      score: Math.round(score * 10) / 10,
      confidence_interval: confidenceInterval,
      verdict,
      indicators: indicatorDetails,
      sentence_flags: sentenceFlags,
      narrative_structure: narrativeStructureInfo,
      summary
    };
  }

  private formatIndicatorName(type: string): string {
    // Convert snake_case to readable format
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  private severityToNumeric(severity: 'low' | 'medium' | 'high'): number {
    switch (severity) {
      case 'low': return 0.33;
      case 'medium': return 0.66;
      case 'high': return 1.0;
    }
  }

  private generateSummary(
    verdict: 'likely_truthful' | 'uncertain' | 'likely_lie',
    indicators: IndicatorDetail[],
    narrativeStructure: NarrativeStructureInfo
  ): string {
    const indicatorCount = indicators.length;
    
    switch (verdict) {
      case 'likely_truthful':
        return this.generateTruthfulSummary(narrativeStructure);
      case 'uncertain':
        return this.generateUncertainSummary(indicatorCount);
      case 'likely_lie':
        return this.generateLieSummary(indicators, narrativeStructure);
    }
  }

  private generateTruthfulSummary(narrativeStructure: NarrativeStructureInfo): string {
    const structureStatus = narrativeStructure.missing.length === 0 
      ? 'complete' 
      : 'incomplete';
    
    return `This statement shows minimal deception indicators. The narrative structure is ${structureStatus} and language patterns appear consistent.`;
  }

  private generateUncertainSummary(indicatorCount: number): string {
    const plural = indicatorCount !== 1 ? 's' : '';
    return `This statement shows some concerning patterns but is inconclusive. ${indicatorCount} indicator${plural} detected. Further context may be needed.`;
  }

  private generateLieSummary(
    indicators: IndicatorDetail[],
    narrativeStructure: NarrativeStructureInfo
  ): string {
    // Get top 3 indicators by contribution
    const topIndicators = [...indicators]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
    
    const indicatorNames = topIndicators.map(i => i.name).join(', ');
    
    let summary = `This statement shows strong deception indicators including ${indicatorNames}.`;
    
    // Add narrative structure issues if present
    if (narrativeStructure.missing.length > 0) {
      const missingComponents = narrativeStructure.missing.join(' and ');
      summary += ` The narrative lacks ${missingComponents}.`;
    }
    
    // Add specific pattern mention if we have high-severity indicators
    const highSeverityIndicators = indicators.filter(i => i.severity === 'high');
    if (highSeverityIndicators.length > 0) {
      const patterns = highSeverityIndicators
        .map(i => this.getPatternDescription(i.name))
        .filter(p => p !== null)
        .slice(0, 2);
      
      if (patterns.length > 0) {
        summary += ` Exhibits ${patterns.join(' and ')}.`;
      }
    }
    
    return summary;
  }

  private getPatternDescription(indicatorName: string): string | null {
    const patternMap: Record<string, string> = {
      'Tense Inconsistency': 'tense shifts',
      'Tense Shift': 'tense shifts',
      'Agent Deletion': 'excessive passive voice',
      'Pronoun Inconsistency': 'pronoun distancing',
      'Low Lexical Diversity': 'limited vocabulary',
      'Negation Clustering': 'defensive language',
      'Incomplete Narrative': 'incomplete story structure',
      'Information Density Mismatch': 'imbalanced detail distribution',
      'Cognitive Load Language': 'excessive hedging'
    };
    
    return patternMap[indicatorName] || null;
  }

  toJSON(report: AnalysisReport): string {
    return JSON.stringify(report, null, 2);
  }

  fromJSON(json: string): AnalysisReport {
    return JSON.parse(json);
  }
}
