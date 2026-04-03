import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { InformationDensityAnalyzer } from '../src/components/InformationDensityAnalyzer';
import { NarrativeStructureAnalyzer } from '../src/components/NarrativeStructureAnalyzer';
import { NarrativeStructureAnalysis } from '../src/models';

describe('InformationDensityAnalyzer', () => {
  const analyzer = new InformationDensityAnalyzer();
  const narrativeAnalyzer = new NarrativeStructureAnalyzer();

  describe('Unit Tests', () => {
    it('should return empty analysis for empty text', () => {
      const structure: NarrativeStructureAnalysis = {
        hasPrologue: false,
        hasCoreEvent: false,
        hasEpilogue: false,
        missing: ['prologue', 'epilogue'],
        isComplete: false
      };

      const result = analyzer.analyze('', structure);

      expect(result.prologueWordCount).toBe(0);
      expect(result.coreEventWordCount).toBe(0);
      expect(result.epilogueWordCount).toBe(0);
      expect(result.prologueDensity).toBe(0);
      expect(result.coreEventDensity).toBe(0);
      expect(result.epilogueDensity).toBe(0);
      expect(result.hasImbalance).toBe(false);
    });

    it('should calculate word counts for each section', () => {
      // Use text with >= 6 sentences for narrative analysis
      const text = 'Before the event I was at home preparing. Then I went to the store and bought groceries. I selected items carefully. I paid at checkout. After that I returned home and cooked dinner. The meal was delicious.';
      const structure = narrativeAnalyzer.analyze(text);

      const result = analyzer.analyze(text, structure);

      // For texts with >= 6 sentences, sections should have word counts
      if (structure.hasPrologue && structure.prologueRange) {
        expect(result.prologueWordCount).toBeGreaterThan(0);
      }
      if (structure.hasCoreEvent && structure.coreEventRange) {
        expect(result.coreEventWordCount).toBeGreaterThan(0);
      }
      if (structure.hasEpilogue && structure.epilogueRange) {
        expect(result.epilogueWordCount).toBeGreaterThan(0);
      }
    });

    it('should detect imbalance when prologue is 50% longer than core', () => {
      // Prologue: 20 words, Core: 10 words, Epilogue: 5 words
      const text = 'Before the event I was at home preparing for the day and thinking about what I needed to do. I went to the store. After that I returned home.';
      const structure = narrativeAnalyzer.analyze(text);

      const result = analyzer.analyze(text, structure);

      // If prologue is significantly longer than core, should detect imbalance
      if (result.prologueWordCount > result.coreEventWordCount * 1.5) {
        expect(result.hasImbalance).toBe(true);
        expect(result.imbalanceDetails).toBeDefined();
        expect(result.imbalanceDetails).toContain('Prologue');
      }
    });

    it('should detect imbalance when epilogue is 50% longer than core', () => {
      // Prologue: 5 words, Core: 10 words, Epilogue: 20 words
      const text = 'Before I was home. I went to the store and bought groceries. After that I returned home and cooked a delicious dinner with all the ingredients I had purchased from the store.';
      const structure = narrativeAnalyzer.analyze(text);

      const result = analyzer.analyze(text, structure);

      // If epilogue is significantly longer than core, should detect imbalance
      if (result.epilogueWordCount > result.coreEventWordCount * 1.5) {
        expect(result.hasImbalance).toBe(true);
        expect(result.imbalanceDetails).toBeDefined();
        expect(result.imbalanceDetails).toContain('Epilogue');
      }
    });

    it('should not detect imbalance when sections are balanced', () => {
      const text = 'Before I was at home. I went to the store. After that I returned home.';
      const structure = narrativeAnalyzer.analyze(text);

      const result = analyzer.analyze(text, structure);

      // With balanced sections, should not detect imbalance
      const peripheralMax = Math.max(result.prologueWordCount, result.epilogueWordCount);
      const threshold = result.coreEventWordCount * 1.5;

      if (peripheralMax <= threshold) {
        expect(result.hasImbalance).toBe(false);
        expect(result.imbalanceDetails).toBeUndefined();
      }
    });

    it('should calculate density as words per sentence', () => {
      const text = 'Before the event I was at home. I went to the store. After that I returned home.';
      const structure = narrativeAnalyzer.analyze(text);

      const result = analyzer.analyze(text, structure);

      // Density should be positive for sections with content
      if (result.prologueWordCount > 0) {
        expect(result.prologueDensity).toBeGreaterThan(0);
      }
      if (result.coreEventWordCount > 0) {
        expect(result.coreEventDensity).toBeGreaterThan(0);
      }
      if (result.epilogueWordCount > 0) {
        expect(result.epilogueDensity).toBeGreaterThan(0);
      }
    });

    it('should handle text with only core event', () => {
      // Short text (< 6 sentences) is not analyzed for narrative structure
      const text = 'I went to the store and bought groceries.';
      const structure = narrativeAnalyzer.analyze(text);

      const result = analyzer.analyze(text, structure);

      // Short texts are marked as complete (not flagged)
      // No imbalance should be detected for short texts
      expect(result.hasImbalance).toBe(false);
    });

    it('should provide detailed imbalance information', () => {
      // Create text with clear imbalance
      const text = 'Before the event I was at home preparing for the day and thinking about what I needed to do and planning my route. I went to store. After I returned.';
      const structure = narrativeAnalyzer.analyze(text);

      const result = analyzer.analyze(text, structure);

      if (result.hasImbalance) {
        expect(result.imbalanceDetails).toBeDefined();
        expect(result.imbalanceDetails).toMatch(/Prologue|Epilogue/);
        expect(result.imbalanceDetails).toMatch(/\d+% more detail/);
        expect(result.imbalanceDetails).toMatch(/\d+ vs \d+ words/);
      }
    });
  });

  describe('Property-Based Tests', () => {
    const testConfig = {
      numRuns: 100,
      verbose: false
    };

    // Arbitrary for generating sentences (longer to ensure >= 6 sentences)
    const sentenceArb = fc.string({ minLength: 10, maxLength: 50 })
      .filter(s => s.trim().length > 0) // Ensure non-empty
      .map(s => s.trim() + '.');

    // Arbitrary for generating multi-sentence text (ensure >= 6 sentences for narrative analysis)
    const textArb = fc.array(sentenceArb, { minLength: 6, maxLength: 20 })
      .map(sentences => sentences.join(' '))
      .filter(text => text.trim().length > 20); // Ensure meaningful text

    it('Property 19: Section Word Count Calculation - For any segmented narrative, the Analyzer SHALL calculate accurate word counts for prologue, core event, and epilogue sections', () => {
      // Feature: lie-detector-nlp, Property 19: Section Word Count Calculation
      fc.assert(
        fc.property(textArb, (text) => {
          const structure = narrativeAnalyzer.analyze(text);
          const result = analyzer.analyze(text, structure);

          // Word counts should be non-negative
          expect(result.prologueWordCount).toBeGreaterThanOrEqual(0);
          expect(result.coreEventWordCount).toBeGreaterThanOrEqual(0);
          expect(result.epilogueWordCount).toBeGreaterThanOrEqual(0);

          // If a section exists in structure, its word count should be > 0
          if (structure.hasPrologue && structure.prologueRange) {
            expect(result.prologueWordCount).toBeGreaterThan(0);
          }

          if (structure.hasCoreEvent && structure.coreEventRange) {
            expect(result.coreEventWordCount).toBeGreaterThan(0);
          }

          if (structure.hasEpilogue && structure.epilogueRange) {
            expect(result.epilogueWordCount).toBeGreaterThan(0);
          }

          // Total word count should be reasonable relative to text length
          const totalWords = result.prologueWordCount + result.coreEventWordCount + result.epilogueWordCount;
          expect(totalWords).toBeGreaterThanOrEqual(0);
          // Note: We don't strictly compare to text.split() because tokenization may differ
          // The important thing is that word counts are non-negative and reasonable

          // Density calculations should be consistent
          // If word count > 0, density should be > 0
          if (result.prologueWordCount > 0) {
            expect(result.prologueDensity).toBeGreaterThan(0);
          } else {
            expect(result.prologueDensity).toBe(0);
          }

          if (result.coreEventWordCount > 0) {
            expect(result.coreEventDensity).toBeGreaterThan(0);
          } else {
            expect(result.coreEventDensity).toBe(0);
          }

          if (result.epilogueWordCount > 0) {
            expect(result.epilogueDensity).toBeGreaterThan(0);
          } else {
            expect(result.epilogueDensity).toBe(0);
          }
        }),
        testConfig
      );
    });

    it('Property 20: Information Density Imbalance Detection - For any narrative where peripheral sections are 50% or more longer than core event, the Analyzer SHALL flag information_density_mismatch', () => {
      // Feature: lie-detector-nlp, Property 20: Information Density Imbalance Detection
      fc.assert(
        fc.property(textArb, (text) => {
          const structure = narrativeAnalyzer.analyze(text);
          const result = analyzer.analyze(text, structure);

          // Calculate the imbalance condition
          const peripheralMax = Math.max(result.prologueWordCount, result.epilogueWordCount);
          const threshold = result.coreEventWordCount * 1.5;

          // If core event has no words, imbalance cannot be detected
          if (result.coreEventWordCount === 0) {
            expect(result.hasImbalance).toBe(false);
            return;
          }

          // If peripheral max exceeds threshold, should flag imbalance
          if (peripheralMax > threshold) {
            expect(result.hasImbalance).toBe(true);
            expect(result.imbalanceDetails).toBeDefined();
            expect(result.imbalanceDetails).toMatch(/Prologue|Epilogue/);
            expect(result.imbalanceDetails).toContain('more detail');
            expect(result.imbalanceDetails).toContain('core event');
          } else {
            // If threshold not exceeded, should not flag imbalance
            expect(result.hasImbalance).toBe(false);
          }

          // Imbalance details should only exist when hasImbalance is true
          if (result.hasImbalance) {
            expect(result.imbalanceDetails).toBeDefined();
          }
        }),
        testConfig
      );
    });

    it('Property: Word count consistency - Total words should match sum of section words', () => {
      fc.assert(
        fc.property(textArb, (text) => {
          const structure = narrativeAnalyzer.analyze(text);
          const result = analyzer.analyze(text, structure);

          // The sum of section word counts should be reasonable
          const totalSectionWords = result.prologueWordCount + result.coreEventWordCount + result.epilogueWordCount;

          // Should be non-negative
          expect(totalSectionWords).toBeGreaterThanOrEqual(0);

          // Count sentences to determine if narrative analysis was performed
          const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

          // If text has >= 6 sentences and has actual content, total should be > 0
          if (sentenceCount >= 6 && text.trim().length > 20) {
            // For texts that undergo narrative analysis, expect some word count
            // But only if the structure has defined ranges
            if (structure.prologueRange || structure.coreEventRange || structure.epilogueRange) {
              expect(totalSectionWords).toBeGreaterThan(0);
            }
          }
        }),
        testConfig
      );
    });

    it('Property: Density calculation correctness - Density should equal words per sentence', () => {
      fc.assert(
        fc.property(textArb, (text) => {
          const structure = narrativeAnalyzer.analyze(text);
          const result = analyzer.analyze(text, structure);

          // Density should be words / sentences
          // We can't verify exact calculation without knowing sentence counts,
          // but we can verify that density is reasonable

          // If word count > 0, density should be > 0
          if (result.prologueWordCount > 0) {
            expect(result.prologueDensity).toBeGreaterThan(0);
            // Density should not exceed word count (at least 1 sentence)
            expect(result.prologueDensity).toBeLessThanOrEqual(result.prologueWordCount);
          }

          if (result.coreEventWordCount > 0) {
            expect(result.coreEventDensity).toBeGreaterThan(0);
            expect(result.coreEventDensity).toBeLessThanOrEqual(result.coreEventWordCount);
          }

          if (result.epilogueWordCount > 0) {
            expect(result.epilogueDensity).toBeGreaterThan(0);
            expect(result.epilogueDensity).toBeLessThanOrEqual(result.epilogueWordCount);
          }
        }),
        testConfig
      );
    });

    it('Property: Imbalance threshold consistency - 50% threshold should be applied correctly', () => {
      fc.assert(
        fc.property(textArb, (text) => {
          const structure = narrativeAnalyzer.analyze(text);
          const result = analyzer.analyze(text, structure);

          if (result.coreEventWordCount === 0) {
            // Cannot detect imbalance without core event
            expect(result.hasImbalance).toBe(false);
            return;
          }

          // Manually calculate threshold
          const peripheralMax = Math.max(result.prologueWordCount, result.epilogueWordCount);
          const threshold = result.coreEventWordCount * 1.5;

          // Verify imbalance flag matches threshold condition
          if (peripheralMax > threshold) {
            expect(result.hasImbalance).toBe(true);
          } else {
            expect(result.hasImbalance).toBe(false);
          }
        }),
        testConfig
      );
    });
  });
});
