import { SyntaxParser } from './SyntaxParser';
import { HeuristicEngine } from './HeuristicEngine';
import { NarrativeStructureAnalyzer } from './NarrativeStructureAnalyzer';
import { InformationDensityAnalyzer } from './InformationDensityAnalyzer';
import { ConfidenceScorer } from './ConfidenceScorer';
import { ReportGenerator } from './ReportGenerator';
import nlp from 'compromise';
import type {
  AnalyzerInput,
  AnalyzerOutput,
  ValidationResult,
  DeceptionIndicator
} from '../models';

/**
 * Analyzer - Core orchestrator for the 9-layer NLP analysis system
 * 
 * This class coordinates all analysis layers and generates comprehensive
 * deception detection reports using sophisticated NLP techniques.
 */
export class Analyzer {
  private syntaxParser: SyntaxParser;
  private heuristicEngine: HeuristicEngine;
  private narrativeAnalyzer: NarrativeStructureAnalyzer;
  private densityAnalyzer: InformationDensityAnalyzer;
  private confidenceScorer: ConfidenceScorer;
  private reportGenerator: ReportGenerator;

  private readonly MIN_TEXT_LENGTH = 10;
  private readonly MAX_TEXT_LENGTH = 10000;

  constructor() {
    this.syntaxParser = new SyntaxParser();
    this.heuristicEngine = new HeuristicEngine();
    this.narrativeAnalyzer = new NarrativeStructureAnalyzer();
    this.densityAnalyzer = new InformationDensityAnalyzer();
    this.confidenceScorer = new ConfidenceScorer();
    this.reportGenerator = new ReportGenerator();
  }

  validateInput(text: string): ValidationResult {
    if (!text || typeof text !== 'string') {
      return {
        isValid: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input must be a valid text string'
        }
      };
    }

    const trimmedText = text.trim();

    if (trimmedText.length < this.MIN_TEXT_LENGTH) {
      return {
        isValid: false,
        error: {
          code: 'TEXT_TOO_SHORT',
          message: 'Text must be at least 10 characters for meaningful analysis',
          details: {
            field: 'text',
            value: trimmedText.length,
            constraint: `minimum ${this.MIN_TEXT_LENGTH} characters`
          }
        }
      };
    }

    if (trimmedText.length > this.MAX_TEXT_LENGTH) {
      return {
        isValid: false,
        error: {
          code: 'TEXT_TOO_LONG',
          message: 'Text exceeds maximum length of 10,000 characters',
          details: {
            field: 'text',
            value: trimmedText.length,
            constraint: `maximum ${this.MAX_TEXT_LENGTH} characters`
          }
        }
      };
    }

    return { isValid: true };
  }

  async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
    try {
      // Validate input
      const validation = this.validateInput(input.text);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const text = input.text;
      const indicators: DeceptionIndicator[] = [];
      let narrativeStructure = null;

      // Parse text once for all SyntaxParser layers (performance optimization)
      const doc = nlp(text);

      // Layer 1: Tense Consistency Analysis
      try {
        const tenseAnalysis = this.syntaxParser.analyzeTenseConsistencyFromDoc(doc, text);
        if (tenseAnalysis.shiftCount > 2) {
          const severity = tenseAnalysis.shiftCount >= 3 ? 'high' : 'medium';
          indicators.push({
            id: `tense_inconsistency_${Date.now()}`,
            name: 'Tense inconsistency',
            type: 'tense_inconsistency',
            severity,
            weight: 0.25,
            contribution: 0, // Will be calculated by scorer
            location: {
              sentenceIndex: tenseAnalysis.inconsistentSentences[0] || 0,
              startChar: 0,
              endChar: 0,
              text: ''
            },
            description: `Detected ${tenseAnalysis.shiftCount} unexplained tense shifts in the narrative`,
            detail: `Detected ${tenseAnalysis.shiftCount} unexplained tense shifts in the narrative`,
            evidence: `${tenseAnalysis.tenseShifts.length} tense shifts found`
          });
        }
      } catch (error) {
        // Continue with other layers if tense analysis fails
      }

      // Layer 2: Agent Deletion Detection
      try {
        const agentAnalysis = this.syntaxParser.analyzeAgentDeletionFromDoc(doc);
        if (agentAnalysis.isExcessive) {
          const severity = agentAnalysis.passivePercentage > 60 ? 'high' : 'medium';
          indicators.push({
            id: `agent_deletion_${Date.now()}`,
            name: 'Agent deletion',
            type: 'agent_deletion',
            severity,
            weight: 0.20,
            contribution: 0,
            location: {
              sentenceIndex: agentAnalysis.passiveSentences[0] || 0,
              startChar: 0,
              endChar: 0,
              text: ''
            },
            description: `Excessive passive voice usage (${agentAnalysis.passivePercentage.toFixed(1)}%) suggests responsibility avoidance`,
            detail: `Excessive passive voice usage (${agentAnalysis.passivePercentage.toFixed(1)}%) suggests responsibility avoidance`,
            evidence: `${agentAnalysis.passiveCount} of ${agentAnalysis.totalSentences} sentences use passive voice`
          });
        }
      } catch (error) {
        // Continue with other layers
      }

      // Layer 3: Pronoun Consistency Analysis
      try {
        const pronounAnalysis = this.syntaxParser.analyzePronounConsistencyFromDoc(doc);
        if (pronounAnalysis.hasShifts && !pronounAnalysis.isInconclusive) {
          const severity = pronounAnalysis.shifts.length > 1 ? 'high' : 'medium';
          indicators.push({
            id: `pronoun_inconsistency_${Date.now()}`,
            name: 'Pronoun inconsistency',
            type: 'pronoun_inconsistency',
            severity,
            weight: 0.10,
            contribution: 0,
            location: {
              sentenceIndex: pronounAnalysis.shifts[0]?.fromSentence || 0,
              startChar: 0,
              endChar: 0,
              text: ''
            },
            description: `Pronoun usage shifts from ${pronounAnalysis.shifts[0]?.fromType} to ${pronounAnalysis.shifts[0]?.toType}`,
            detail: `Pronoun usage shifts from ${pronounAnalysis.shifts[0]?.fromType} to ${pronounAnalysis.shifts[0]?.toType}`,
            evidence: `${pronounAnalysis.shifts.length} pronoun shifts detected`
          });
        }
      } catch (error) {
        // Continue with other layers
      }

      // Layer 4: Lexical Diversity (TTR)
      try {
        const lexicalAnalysis = this.heuristicEngine.analyzeLexicalDiversity(text);
        if (lexicalAnalysis.isLowDiversity) {
          const severity = lexicalAnalysis.typeTokenRatio < 0.4 ? 'high' : 'medium';
          indicators.push({
            id: `low_lexical_diversity_${Date.now()}`,
            name: 'Low lexical diversity',
            type: 'low_lexical_diversity',
            severity,
            weight: 0.10,
            contribution: 0,
            location: {
              sentenceIndex: 0,
              startChar: 0,
              endChar: 0,
              text: ''
            },
            description: `Limited vocabulary richness (TTR: ${lexicalAnalysis.typeTokenRatio.toFixed(2)}) may indicate fabrication`,
            detail: `Limited vocabulary richness (TTR: ${lexicalAnalysis.typeTokenRatio.toFixed(2)}) may indicate fabrication`,
            evidence: `${lexicalAnalysis.uniqueWords} unique words out of ${lexicalAnalysis.totalWords} total`
          });
        }
      } catch (error) {
        // Continue with other layers
      }

      // Layer 5: Negation Clustering
      try {
        const negationAnalysis = this.heuristicEngine.analyzeNegationClustering(text);
        if (negationAnalysis.clusteredSentences.length > 0 || negationAnalysis.negationDensity > 0.25) {
          const severity = negationAnalysis.negationDensity > 0.5 ? 'high' : 'medium';
          indicators.push({
            id: `negation_clustering_${Date.now()}`,
            name: 'Negation clustering',
            type: 'negation_clustering',
            severity,
            weight: 0.15,
            contribution: 0,
            location: {
              sentenceIndex: negationAnalysis.clusteredSentences[0] || 0,
              startChar: 0,
              endChar: 0,
              text: ''
            },
            description: `Defensive language pattern with ${negationAnalysis.totalNegations} negations (density: ${negationAnalysis.negationDensity.toFixed(2)})`,
            detail: `Defensive language pattern with ${negationAnalysis.totalNegations} negations (density: ${negationAnalysis.negationDensity.toFixed(2)})`,
            evidence: `${negationAnalysis.clusteredSentences.length} sentences with multiple negations`
          });
        }
      } catch (error) {
        // Continue with other layers
      }

      // Layer 6: Narrative Structure
      try {
        const narrativeAnalysis = this.narrativeAnalyzer.analyze(text);
        narrativeStructure = narrativeAnalysis; // Store for report generation
        if (!narrativeAnalysis.isComplete) {
          const severity = narrativeAnalysis.missing.length > 1 ? 'high' : 'medium';
          indicators.push({
            id: `incomplete_narrative_${Date.now()}`,
            name: 'Incomplete narrative',
            type: 'incomplete_narrative',
            severity,
            weight: 0.15,
            contribution: 0,
            location: {
              sentenceIndex: 0,
              startChar: 0,
              endChar: 0,
              text: ''
            },
            description: `Narrative lacks ${narrativeAnalysis.missing.join(' and ')}`,
            detail: `Narrative lacks ${narrativeAnalysis.missing.join(' and ')}`,
            evidence: `Missing components: ${narrativeAnalysis.missing.join(', ')}`
          });
        }
      } catch (error) {
        // Continue with other layers
      }

      // Layer 9: Contradiction Detection
      try {
        const contradictionAnalysis = this.detectContradictions(doc, text);
        if (contradictionAnalysis.contradictions.length > 0) {
          const severity = contradictionAnalysis.contradictions.length > 1 ? 'high' : 'medium';
          indicators.push({
            id: `contradiction_detection_${Date.now()}`,
            name: 'Contradiction detection',
            type: 'contradiction_detection',
            severity,
            weight: 0.15,
            contribution: 0,
            location: {
              sentenceIndex: contradictionAnalysis.contradictions[0].sentenceIndex || 0,
              startChar: 0,
              endChar: 0,
              text: ''
            },
            description: contradictionAnalysis.contradictions[0].description,
            detail: contradictionAnalysis.contradictions[0].description,
            evidence: `${contradictionAnalysis.contradictions.length} contradiction(s) found`
          });
        }
      } catch (error) {
        // Continue with other layers
      }

      // Layer 7: Information Density Distribution
      try {
        const narrativeStructure = this.narrativeAnalyzer.analyze(text);
        const densityAnalysis = this.densityAnalyzer.analyze(text, narrativeStructure);
        
        if (densityAnalysis.hasImbalance) {
          const maxPeripheral = Math.max(densityAnalysis.prologueWordCount, densityAnalysis.epilogueWordCount);
          const ratio = maxPeripheral / densityAnalysis.coreEventWordCount;
          const severity = ratio > 2 ? 'high' : 'medium';
          
          indicators.push({
            id: `information_density_mismatch_${Date.now()}`,
            name: 'Information density mismatch',
            type: 'information_density_mismatch',
            severity,
            weight: 0.10,
            contribution: 0,
            location: {
              sentenceIndex: 0,
              startChar: 0,
              endChar: 0,
              text: ''
            },
            description: densityAnalysis.imbalanceDetails || 'Peripheral details exceed core event detail',
            detail: densityAnalysis.imbalanceDetails || 'Peripheral details exceed core event detail',
            evidence: `Prologue: ${densityAnalysis.prologueWordCount} words, Core: ${densityAnalysis.coreEventWordCount} words, Epilogue: ${densityAnalysis.epilogueWordCount} words`
          });
        }
      } catch (error) {
        // Continue with other layers
      }

      // Layer 8: Cognitive Load Language
      try {
        const cognitiveAnalysis = this.heuristicEngine.analyzeCognitiveLoad(text);
        if (cognitiveAnalysis.isExcessive || cognitiveAnalysis.veracityEmphasis.length > 0) {
          const severity = cognitiveAnalysis.veracityEmphasis.length > 0 ? 'high' : 
                          cognitiveAnalysis.hedgeDensity > 0.5 ? 'high' : 'medium';
          
          const hedgeTypes = [];
          if (cognitiveAnalysis.memoryHedges.length > 0) hedgeTypes.push('memory hedges');
          if (cognitiveAnalysis.probabilityHedges.length > 0) hedgeTypes.push('probability hedges');
          if (cognitiveAnalysis.distancingLanguage.length > 0) hedgeTypes.push('distancing language');
          if (cognitiveAnalysis.veracityEmphasis.length > 0) hedgeTypes.push('veracity emphasis (RED FLAG)');
          
          indicators.push({
            id: `cognitive_load_language_${Date.now()}`,
            name: 'Cognitive load language',
            type: 'cognitive_load_language',
            severity,
            weight: 0.10,
            contribution: 0,
            location: {
              sentenceIndex: cognitiveAnalysis.memoryHedges[0]?.sentenceIndex || 
                            cognitiveAnalysis.veracityEmphasis[0]?.sentenceIndex || 0,
              startChar: 0,
              endChar: 0,
              text: ''
            },
            description: `Excessive hedge words and uncertainty markers (density: ${cognitiveAnalysis.hedgeDensity.toFixed(2)})`,
            detail: `Excessive hedge words and uncertainty markers (density: ${cognitiveAnalysis.hedgeDensity.toFixed(2)})`,
            evidence: `${cognitiveAnalysis.totalHedges} hedges found: ${hedgeTypes.join(', ')}`
          });
        }
      } catch (error) {
        // Continue with scoring
      }

      // Layer 9: Calculate weighted confidence score
      const scoringResult = this.confidenceScorer.calculateScore({ 
        indicators, 
        textLength: text.length 
      });

      // Update indicator contributions
      indicators.forEach(indicator => {
        const contribution = scoringResult.indicatorContributions.find(
          ic => ic.indicatorName === indicator.name
        );
        if (contribution) {
          indicator.contribution = contribution.contribution;
        }
      });

      // Generate report
      const report = this.reportGenerator.generateReport({
        text,
        score: scoringResult.score,
        confidenceInterval: scoringResult.confidenceInterval,
        verdict: scoringResult.verdict,
        indicators,
        narrativeStructure: narrativeStructure || undefined
      });

      return {
        success: true,
        data: report
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: 'Unable to complete analysis due to internal error'
        }
      };
    }
  }

  /**
   * Detect contradictions within a single input
   * Checks for same subject with contradictory verbs/states
   */
  private detectContradictions(doc: any, text: string): { contradictions: Array<{ description: string; sentenceIndex: number }> } {
    const contradictions: Array<{ description: string; sentenceIndex: number }> = [];
    const sentences = doc.sentences().out('array') as string[];
    const lowerText = text.toLowerCase();

    // Simple contradiction patterns
    const contradictionPatterns = [
      { pattern1: /\b(was|were)\s+home\b/i, pattern2: /\b(went|left|was)\s+(out|away)\b/i, description: 'Contradictory location: "was home" vs "went out"' },
      { pattern1: /\b(was|were)\s+home\b/i, pattern2: /\bdidn'?t\s+(go|leave)\b/i, description: 'Defensive contradiction about location' },
      { pattern1: /\bnever\s+left\b/i, pattern2: /\b(was|were)\s+home\b/i, description: 'Redundant defensive statements about location' },
      { pattern1: /\bleft\s+at\s+(\d+)/i, pattern2: /\bleft\s+at\s+(\d+)/i, description: 'Contradictory departure times', checkNumbers: true },
      { pattern1: /\barrived\s+at\s+(\d+)/i, pattern2: /\barrived\s+at\s+(\d+)/i, description: 'Contradictory arrival times', checkNumbers: true },
      { pattern1: /\bdidn'?t\s+(\w+)/i, pattern2: /\b(did|was|were)\s+\1/i, description: 'Contradictory action statements' },
      { pattern1: /\bnever\s+(\w+)/i, pattern2: /\b(did|was|were)\s+\1/i, description: 'Contradictory action with "never"' },
      { pattern1: /\bdidn'?t\s+go\b/i, pattern2: /\bnever\s+left\b/i, description: 'Excessive denial clustering' },
      { pattern1: /\bdefinitely\b/i, pattern2: /\b(swear|honestly|truth)\b/i, description: 'Multiple veracity emphasis markers' },
      { pattern1: /\bswear\b/i, pattern2: /\bhonestly\b/i, description: 'Excessive veracity emphasis' }
    ];

    // Check for basic contradictions
    for (const pattern of contradictionPatterns) {
      const match1 = lowerText.match(pattern.pattern1);
      const match2 = lowerText.match(pattern.pattern2);

      if (match1 && match2) {
        if (pattern.checkNumbers) {
          // Extract numbers and compare
          const num1 = match1[1];
          const num2 = match2[1];
          if (num1 !== num2) {
            contradictions.push({
              description: `${pattern.description}: "${num1}" vs "${num2}"`,
              sentenceIndex: 0
            });
          }
        } else {
          contradictions.push({
            description: pattern.description,
            sentenceIndex: 0
          });
        }
      }
    }

    // Extract subject-verb pairs using compromise
    const subjectVerbPairs: Array<{ subject: string; verb: string; sentence: number }> = [];
    
    sentences.forEach((sentence: string, idx: number) => {
      const sentenceDoc = nlp(sentence);
      const subjects = sentenceDoc.nouns().out('array');
      const verbs = sentenceDoc.verbs().out('array');
      
      subjects.forEach((subject: string) => {
        verbs.forEach((verb: string) => {
          subjectVerbPairs.push({
            subject: subject.toLowerCase(),
            verb: verb.toLowerCase(),
            sentence: idx
          });
        });
      });
    });

    // Check for contradictory subject-verb pairs
    for (let i = 0; i < subjectVerbPairs.length; i++) {
      for (let j = i + 1; j < subjectVerbPairs.length; j++) {
        const pair1 = subjectVerbPairs[i];
        const pair2 = subjectVerbPairs[j];
        
        // Same subject, different verbs that might contradict
        if (pair1.subject === pair2.subject && pair1.verb !== pair2.verb) {
          // Check for obvious contradictions
          const contradictoryVerbs = [
            ['stayed', 'left'],
            ['was', 'wasn\'t'],
            ['did', 'didn\'t'],
            ['went', 'stayed'],
            ['arrived', 'left']
          ];
          
          for (const [verb1, verb2] of contradictoryVerbs) {
            if ((pair1.verb.includes(verb1) && pair2.verb.includes(verb2)) ||
                (pair1.verb.includes(verb2) && pair2.verb.includes(verb1))) {
              contradictions.push({
                description: `Contradictory statements about "${pair1.subject}": "${pair1.verb}" vs "${pair2.verb}"`,
                sentenceIndex: pair1.sentence
              });
            }
          }
        }
      }
    }

    return { contradictions };
  }
}
