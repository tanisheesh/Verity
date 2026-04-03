import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { AnalysisReport, DeceptionIndicator } from '../src/models';

describe('Model Tests', () => {
  describe('Property 32: JSON Serialization Round-Trip', () => {
    it('should preserve data through JSON serialization and deserialization', () => {
      // Feature: lie-detector-nlp, Property 32: JSON Serialization Round-Trip
      fc.assert(
        fc.property(
          fc.record({
            confidenceScore: fc.integer({ min: 0, max: 100 }),
            confidenceLevel: fc.constantFrom('Low', 'Medium', 'High'),
            indicators: fc.array(fc.record({
              id: fc.string(),
              type: fc.constantFrom('tense_shift', 'pronoun_distancing', 'sentiment_anomaly', 'over_explanation', 'evasion_pattern', 'entity_vagueness'),
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
            })),
            highlightedText: fc.string(),
            summary: fc.string(),
            metadata: fc.record({
              textLength: fc.nat(),
              sentenceCount: fc.nat(),
              wordCount: fc.nat(),
              processingTime: fc.nat(),
              timestamp: fc.string()
            }),
            linguisticFeatures: fc.record({
              pronounRatio: fc.float({ min: 0, max: 1 }),
              averageSentenceLength: fc.float({ min: 0, max: 100 }),
              sentimentPolarity: fc.float({ min: -1, max: 1 }),
              passiveVoicePercentage: fc.float({ min: 0, max: 1 }),
              entityDensity: fc.float({ min: 0, max: 10 })
            })
          }),
          (report) => {
            const json = JSON.stringify(report);
            const parsed = JSON.parse(json);
            
            expect(parsed.confidenceScore).toBe(report.confidenceScore);
            expect(parsed.confidenceLevel).toBe(report.confidenceLevel);
            expect(parsed.indicators.length).toBe(report.indicators.length);
            expect(parsed.summary).toBe(report.summary);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 31: JSON Text Escaping', () => {
    it('should properly escape special characters in JSON', () => {
      // Feature: lie-detector-nlp, Property 31: JSON Text Escaping
      fc.assert(
        fc.property(
          fc.string(),
          (text) => {
            const obj = { text };
            const json = JSON.stringify(obj);
            const parsed = JSON.parse(json);
            
            expect(parsed.text).toBe(text);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
