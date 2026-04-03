import nlp from 'compromise';
import { WordTokenizer } from 'natural';
import { NarrativeStructureAnalysis, InformationDensityAnalysis } from '../models';

/**
 * InformationDensityAnalyzer
 * 
 * Analyzes the distribution of information density across narrative sections.
 * Detects imbalanced narratives where peripheral sections (prologue/epilogue)
 * contain significantly more detail than the core event, which may indicate
 * fabrication or evasion.
 */
export class InformationDensityAnalyzer {
  private tokenizer: WordTokenizer;

  constructor() {
    this.tokenizer = new WordTokenizer();
  }

  /**
   * Analyze information density distribution across narrative sections
   */
  analyze(text: string, structure: NarrativeStructureAnalysis): InformationDensityAnalysis {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array') as string[];

    if (sentences.length === 0) {
      return this.createEmptyAnalysis();
    }

    // Extract text sections using ranges from narrative structure
    const prologueText = this.extractSection(sentences, structure.prologueRange);
    const coreEventText = this.extractSection(sentences, structure.coreEventRange);
    const epilogueText = this.extractSection(sentences, structure.epilogueRange);

    // Calculate word counts for each section
    const prologueWordCount = this.countWords(prologueText);
    const coreEventWordCount = this.countWords(coreEventText);
    const epilogueWordCount = this.countWords(epilogueText);

    // Calculate density (words per sentence) for each section
    const prologueSentenceCount = this.countSentences(sentences, structure.prologueRange);
    const coreEventSentenceCount = this.countSentences(sentences, structure.coreEventRange);
    const epilogueSentenceCount = this.countSentences(sentences, structure.epilogueRange);

    const prologueDensity = prologueSentenceCount > 0 ? prologueWordCount / prologueSentenceCount : 0;
    const coreEventDensity = coreEventSentenceCount > 0 ? coreEventWordCount / coreEventSentenceCount : 0;
    const epilogueDensity = epilogueSentenceCount > 0 ? epilogueWordCount / epilogueSentenceCount : 0;

    // Detect imbalance: peripheralMax = max(prologue, epilogue); threshold = core * 1.5
    const { hasImbalance, imbalanceDetails } = this.detectImbalance(
      prologueWordCount,
      coreEventWordCount,
      epilogueWordCount
    );

    return {
      prologueWordCount,
      coreEventWordCount,
      epilogueWordCount,
      prologueDensity,
      coreEventDensity,
      epilogueDensity,
      hasImbalance,
      imbalanceDetails
    };
  }

  /**
   * Extract text section using sentence range
   */
  private extractSection(sentences: string[], range?: { start: number; end: number }): string {
    if (!range) {
      return '';
    }

    const { start, end } = range;
    
    // Ensure indices are within bounds
    const safeStart = Math.max(0, Math.min(start, sentences.length - 1));
    const safeEnd = Math.max(0, Math.min(end, sentences.length - 1));

    if (safeStart > safeEnd) {
      return '';
    }

    return sentences.slice(safeStart, safeEnd + 1).join(' ');
  }

  /**
   * Count words in text using natural tokenizer
   */
  private countWords(text: string): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }

    const tokens = this.tokenizer.tokenize(text);
    
    if (!tokens) {
      return 0;
    }

    // Filter out punctuation-only tokens
    const wordTokens = tokens.filter(token => /\w/.test(token));
    
    return wordTokens.length;
  }

  /**
   * Count sentences in a range
   */
  private countSentences(sentences: string[], range?: { start: number; end: number }): number {
    if (!range) {
      return 0;
    }

    const { start, end } = range;
    
    // Ensure indices are within bounds
    const safeStart = Math.max(0, Math.min(start, sentences.length - 1));
    const safeEnd = Math.max(0, Math.min(end, sentences.length - 1));

    if (safeStart > safeEnd) {
      return 0;
    }

    return safeEnd - safeStart + 1;
  }

  /**
   * Detect imbalance in information density
   * If peripheral sections (prologue or epilogue) are 50%+ longer than core event, flag as imbalanced
   */
  private detectImbalance(
    prologueWordCount: number,
    coreEventWordCount: number,
    epilogueWordCount: number
  ): { hasImbalance: boolean; imbalanceDetails?: string } {
    // If core event has no words, cannot detect imbalance
    if (coreEventWordCount === 0) {
      return { hasImbalance: false };
    }

    const peripheralMax = Math.max(prologueWordCount, epilogueWordCount);
    const threshold = coreEventWordCount * 1.5; // 50% longer

    if (peripheralMax > threshold) {
      const ratio = peripheralMax / coreEventWordCount;
      const percentageMore = Math.round((ratio - 1) * 100);
      
      const longerSection = prologueWordCount > epilogueWordCount ? 'Prologue' : 'Epilogue';
      
      const imbalanceDetails = `${longerSection} contains ${percentageMore}% more detail than core event (${peripheralMax} vs ${coreEventWordCount} words)`;

      return {
        hasImbalance: true,
        imbalanceDetails
      };
    }

    return { hasImbalance: false };
  }

  /**
   * Create empty analysis for invalid input
   */
  private createEmptyAnalysis(): InformationDensityAnalysis {
    return {
      prologueWordCount: 0,
      coreEventWordCount: 0,
      epilogueWordCount: 0,
      prologueDensity: 0,
      coreEventDensity: 0,
      epilogueDensity: 0,
      hasImbalance: false
    };
  }
}
