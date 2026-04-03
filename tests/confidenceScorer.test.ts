import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ConfidenceScorer } from '../src/components/ConfidenceScorer';
import { DeceptionIndicator } from '../src/models';

describe('ConfidenceScorer Tests', () => {
  let scorer: ConfidenceScorer;

  beforeEach(() => {
    scorer = new ConfidenceScorer();
  });

  describe('Property 27: Weighted Scoring System', () => {
    it('should calculate score using indicator_weight × indicator_severity × 100', () => {
      // Feature: lie-detector-nlp, Property 27: Weighted Scoring System
      fc.assert(
        fc.property(
          fc.array(fc.record({
            id: fc.string(),
            type: fc.constantFrom(
              'tense_inconsistency',
              'agent_deletion',
              'pronoun_inconsistency',
              'low_lexical_diversity',
              'negation_clustering',
              'incomplete_narrative',
              'information_density_mismatch',
              'cognitive_load_language'
            ),
            severity: fc.constantFrom('low', 'medium', 'high'),
            location: fc.record({
              sentenceIndex: fc.nat(),
              startChar: fc.nat(),
              endChar: fc.nat(),
              text: fc.string()
            }),
            description: fc.string(),
            evidence: fc.string(),
            weight: fc.float({ min: 0, max: 1 })
          }), { minLength: 1, maxLength: 8 }),
          fc.integer({ min: 10, max: 10000 }),
          (indicators, textLength) => {
            const result = scorer.calculateScore({ indicators, textLength });
            
            // Verify each contribution follows the formula
            result.indicatorContributions.forEach(contrib => {
              const expectedContribution = contrib.weight * contrib.severity * 100;
              expect(Math.abs(contrib.contribution - expectedContribution)).toBeLessThan(0.01);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 28: Indicator Contribution Calculation', () => {
    it('should correctly calculate contribution for each indicator', () => {
      // Feature: lie-detector-nlp, Property 28: Indicator Contribution Calculation
      const testCases = [
        { type: 'tense_inconsistency', severity: 'high', expectedWeight: 0.25, expectedContribution: 25 },
        { type: 'incomplete_narrative', severity: 'medium', expectedWeight: 0.20, expectedContribution: 13.2 },
        { type: 'agent_deletion', severity: 'low', expectedWeight: 0.20, expectedContribution: 6.6 },
        { type: 'negation_clustering', severity: 'high', expectedWeight: 0.15, expectedContribution: 15 },
        { type: 'information_density_mismatch', severity: 'medium', expectedWeight: 0.15, expectedContribution: 9.9 },
        { type: 'cognitive_load_language', severity: 'low', expectedWeight: 0.12, expectedContribution: 3.96 },
        { type: 'low_lexical_diversity', severity: 'high', expectedWeight: 0.12, expectedContribution: 12 },
        { type: 'pronoun_inconsistency', severity: 'medium', expectedWeight: 0.10, expectedContribution: 6.6 }
      ];

      testCases.forEach(testCase => {
        const indicator: DeceptionIndicator = {
          id: 'test_1',
          type: testCase.type as any,
          severity: testCase.severity as any,
          location: { sentenceIndex: 0, startChar: 0, endChar: 10, text: 'test' },
          description: 'test',
          evidence: 'test',
          weight: testCase.expectedWeight
        };

        const result = scorer.calculateScore({ indicators: [indicator], textLength: 100 });
        
        expect(result.indicatorContributions.length).toBe(1);
        expect(result.indicatorContributions[0].weight).toBe(testCase.expectedWeight);
        expect(Math.abs(result.indicatorContributions[0].contribution - testCase.expectedContribution)).toBeLessThan(0.1);
      });
    });
  });

  describe('Property 29: Confidence Score Range and Capping', () => {
    it('should return scores within 0-100 range and cap at 100', () => {
      // Feature: lie-detector-nlp, Property 29: Confidence Score Range and Capping
      fc.assert(
        fc.property(
          fc.array(fc.record({
            id: fc.string(),
            type: fc.constantFrom(
              'tense_inconsistency',
              'agent_deletion',
              'pronoun_inconsistency',
              'low_lexical_diversity',
              'negation_clustering',
              'incomplete_narrative',
              'information_density_mismatch',
              'cognitive_load_language'
            ),
            severity: fc.constantFrom('low', 'medium', 'high'),
            location: fc.record({
              sentenceIndex: fc.nat(),
              startChar: fc.nat(),
              endChar: fc.nat(),
              text: fc.string()
            }),
            description: fc.string(),
            evidence: fc.string(),
            weight: fc.float({ min: 0, max: 1 })
          }), { maxLength: 20 }),
          fc.integer({ min: 10, max: 10000 }),
          (indicators, textLength) => {
            const result = scorer.calculateScore({ indicators, textLength });
            
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cap score at 100 even with many high-severity indicators', () => {
      // Create 10 high-severity indicators (would exceed 100 without capping)
      const indicators: DeceptionIndicator[] = Array(10).fill(null).map((_, i) => ({
        id: `ind_${i}`,
        type: 'tense_inconsistency' as const,
        severity: 'high' as const,
        location: { sentenceIndex: 0, startChar: 0, endChar: 10, text: 'test' },
        description: 'test',
        evidence: 'test',
        weight: 0.25
      }));

      const result = scorer.calculateScore({ indicators, textLength: 100 });
      
      expect(result.score).toBe(100);
    });
  });

  describe('Property 30: Confidence Interval Calculation', () => {
    it('should calculate confidence interval based on text length', () => {
      // Feature: lie-detector-nlp, Property 30: Confidence Interval Calculation
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 10000 }),
          (textLength) => {
            const interval = scorer.calculateConfidenceInterval(textLength);
            
            // Formula: max(5, 20 - (textLength / 1000) * 2)
            const expected = Math.max(5, 20 - (textLength / 1000) * 2);
            
            expect(interval).toBe(expected);
            expect(interval).toBeGreaterThanOrEqual(5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have narrower intervals for longer texts', () => {
      const shortTextInterval = scorer.calculateConfidenceInterval(100);
      const longTextInterval = scorer.calculateConfidenceInterval(5000);
      
      expect(shortTextInterval).toBeGreaterThan(longTextInterval);
    });

    it('should have minimum interval of 5', () => {
      const veryLongTextInterval = scorer.calculateConfidenceInterval(100000);
      
      expect(veryLongTextInterval).toBe(5);
    });
  });

  describe('Property 31: Verdict Label Mapping', () => {
    it('should map scores to correct verdict labels', () => {
      // Feature: lie-detector-nlp, Property 31: Verdict Label Mapping
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (score) => {
            const verdict = scorer.getVerdict(score);
            
            if (score <= 33) {
              expect(verdict).toBe('likely_truthful');
            } else if (score <= 66) {
              expect(verdict).toBe('uncertain');
            } else {
              expect(verdict).toBe('likely_lie');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle boundary cases correctly', () => {
      expect(scorer.getVerdict(0)).toBe('likely_truthful');
      expect(scorer.getVerdict(33)).toBe('likely_truthful');
      expect(scorer.getVerdict(34)).toBe('uncertain');
      expect(scorer.getVerdict(66)).toBe('uncertain');
      expect(scorer.getVerdict(67)).toBe('likely_lie');
      expect(scorer.getVerdict(100)).toBe('likely_lie');
    });
  });

  describe('Unit Test: Zero Indicators Case', () => {
    it('should return 0 score when no indicators detected', () => {
      const result = scorer.calculateScore({ indicators: [], textLength: 100 });
      
      expect(result.score).toBe(0);
      expect(result.verdict).toBe('likely_truthful');
      expect(result.indicatorContributions).toEqual([]);
    });
  });

  describe('Unit Test: Severity Mapping', () => {
    it('should map severity to correct numeric values', () => {
      const lowIndicator: DeceptionIndicator = {
        id: 'test_1',
        type: 'tense_inconsistency',
        severity: 'low',
        location: { sentenceIndex: 0, startChar: 0, endChar: 10, text: 'test' },
        description: 'test',
        evidence: 'test',
        weight: 0.25
      };

      const mediumIndicator: DeceptionIndicator = {
        ...lowIndicator,
        id: 'test_2',
        severity: 'medium'
      };

      const highIndicator: DeceptionIndicator = {
        ...lowIndicator,
        id: 'test_3',
        severity: 'high'
      };

      const lowResult = scorer.calculateScore({ indicators: [lowIndicator], textLength: 100 });
      const mediumResult = scorer.calculateScore({ indicators: [mediumIndicator], textLength: 100 });
      const highResult = scorer.calculateScore({ indicators: [highIndicator], textLength: 100 });

      // low: 0.25 * 0.33 * 100 = 8.25
      expect(Math.abs(lowResult.score - 8.25)).toBeLessThan(0.1);
      
      // medium: 0.25 * 0.66 * 100 = 16.5
      expect(Math.abs(mediumResult.score - 16.5)).toBeLessThan(0.1);
      
      // high: 0.25 * 1.0 * 100 = 25
      expect(Math.abs(highResult.score - 25)).toBeLessThan(0.1);
    });
  });
});
