import nlp from 'compromise';
import { NarrativeStructureAnalysis } from '../models';

/**
 * NarrativeStructureAnalyzer
 * 
 * Analyzes text to identify narrative structure components:
 * - Prologue: contextual setup before the main event
 * - Core Event: the main action or claim
 * - Epilogue: aftermath or consequences following the event
 * 
 * Flags incomplete narratives (missing prologue or epilogue) as potential deception indicators.
 */
export class NarrativeStructureAnalyzer {
  
  /**
   * Analyze text for narrative structure completeness
   */
  analyze(text: string): NarrativeStructureAnalysis {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array') as string[];
    
    if (sentences.length === 0) {
      return this.createEmptyAnalysis();
    }

    // Only run narrative analysis if text has >= 6 sentences
    // Below 6 sentences, mark as inconclusive
    if (sentences.length < 6) {
      return {
        hasPrologue: true,
        hasCoreEvent: true,
        hasEpilogue: true,
        missing: [],
        isComplete: true
      };
    }

    const totalSentences = sentences.length;
    
    // Define section boundaries (ensure at least 1 sentence per section for short texts)
    const prologueEnd = Math.max(1, Math.floor(totalSentences * 0.3));
    const coreStart = Math.floor(totalSentences * 0.3);
    const coreEnd = Math.max(coreStart + 1, Math.floor(totalSentences * 0.7));
    const epilogueStart = Math.floor(totalSentences * 0.7);

    // Identify prologue (first 30% or at least first sentence)
    const prologueResult = this.identifyPrologue(sentences.slice(0, prologueEnd));
    
    // Identify core event (middle 40-60%)
    const coreEventResult = this.identifyCoreEvent(sentences.slice(coreStart, coreEnd), coreStart);
    
    // Identify epilogue (last 30%)
    const epilogueResult = this.identifyEpilogue(sentences.slice(epilogueStart), epilogueStart);

    // Determine missing components
    const missing: string[] = [];
    if (!prologueResult.found) {
      missing.push('prologue');
    }
    if (!epilogueResult.found) {
      missing.push('epilogue');
    }

    const isComplete = missing.length === 0;

    return {
      hasPrologue: prologueResult.found,
      hasCoreEvent: coreEventResult.found,
      hasEpilogue: epilogueResult.found,
      missing,
      prologueRange: prologueResult.range,
      coreEventRange: coreEventResult.range,
      epilogueRange: epilogueResult.range,
      isComplete
    };
  }

  /**
   * Identify prologue: contextual setup markers in first 30%
   */
  private identifyPrologue(sentences: string[]): { found: boolean; range?: { start: number; end: number } } {
    if (sentences.length === 0) {
      return { found: false };
    }

    // Temporal markers
    const temporalMarkers = ['before', 'earlier', 'previously', 'that day', 'that morning', 'that evening', 'yesterday', 'last night', 'last week', 'last month'];
    
    // Time reference patterns (e.g., "at 3pm", "at 6:00")
    const timeReferencePattern = /\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/i;
    
    // Setting markers
    const settingMarkers = ['i was at', 'we were in', 'i was in', 'we were at', 'the situation was', 'it was'];

    let foundMarker = false;
    let lastMarkerIndex = -1;

    for (let i = 0; i < sentences.length; i++) {
      const sentenceLower = sentences[i].toLowerCase();
      
      // Check for temporal markers
      for (const marker of temporalMarkers) {
        if (sentenceLower.includes(marker)) {
          foundMarker = true;
          lastMarkerIndex = i;
          break;
        }
      }
      
      // Check for time references in first sentence
      if (i === 0 && timeReferencePattern.test(sentenceLower)) {
        foundMarker = true;
        lastMarkerIndex = i;
      }
      
      // Check for setting markers
      for (const marker of settingMarkers) {
        if (sentenceLower.includes(marker)) {
          foundMarker = true;
          lastMarkerIndex = i;
          break;
        }
      }
    }

    if (foundMarker) {
      return {
        found: true,
        range: { start: 0, end: lastMarkerIndex }
      };
    }

    return { found: false };
  }

  /**
   * Identify core event: main action in middle 40-60%
   */
  private identifyCoreEvent(sentences: string[], offset: number): { found: boolean; range?: { start: number; end: number } } {
    if (sentences.length === 0) {
      return { found: false };
    }

    // Core event is always present if we have valid text
    // Look for action verbs in past tense and high detail density
    let hasActionVerbs = false;

    for (const sentence of sentences) {
      const doc = nlp(sentence);
      const verbs = doc.verbs();
      
      if (verbs.length > 0) {
        hasActionVerbs = true;
        break;
      }
    }

    // Core event is considered present if we have sentences with verbs
    if (hasActionVerbs || sentences.length > 0) {
      return {
        found: true,
        range: { start: offset, end: offset + sentences.length - 1 }
      };
    }

    return { found: false };
  }

  /**
   * Identify epilogue: aftermath markers in last 30%
   */
  private identifyEpilogue(sentences: string[], offset: number): { found: boolean; range?: { start: number; end: number } } {
    if (sentences.length === 0) {
      return { found: false };
    }

    // Consequence markers
    const consequenceMarkers = ['after', 'then', 'later', 'since then', 'afterwards', 'following that'];
    
    // Reflection markers
    const reflectionMarkers = ['i realized', 'i learned', 'now i know', 'i understand', 'i discovered', 'it became clear'];

    let foundMarker = false;
    let firstMarkerIndex = -1;

    for (let i = 0; i < sentences.length; i++) {
      const sentenceLower = sentences[i].toLowerCase();
      
      // Check for consequence markers
      for (const marker of consequenceMarkers) {
        if (sentenceLower.includes(marker)) {
          foundMarker = true;
          if (firstMarkerIndex === -1) {
            firstMarkerIndex = i;
          }
          break;
        }
      }
      
      // Check for reflection markers
      for (const marker of reflectionMarkers) {
        if (sentenceLower.includes(marker)) {
          foundMarker = true;
          if (firstMarkerIndex === -1) {
            firstMarkerIndex = i;
          }
          break;
        }
      }
    }

    if (foundMarker) {
      return {
        found: true,
        range: { start: offset + firstMarkerIndex, end: offset + sentences.length - 1 }
      };
    }

    return { found: false };
  }

  /**
   * Create empty analysis for invalid input
   */
  private createEmptyAnalysis(): NarrativeStructureAnalysis {
    return {
      hasPrologue: false,
      hasCoreEvent: false,
      hasEpilogue: false,
      missing: ['prologue', 'epilogue'],
      isComplete: false
    };
  }
}
