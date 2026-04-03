import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ReportGenerator } from '../src/components/ReportGenerator';

describe('ReportGenerator Tests', () => {
  let generator: ReportGenerator;

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  describe('Property 29: Analysis Report Structure', () => {
    it('should generate reports with all required fields', () => {
      // Feature: lie-detector-nlp, Property 29: Analysis Report Structure
      const input = {
        text: "This is a test message for analysis.",
        score: 50,
        confidenceInterval: 15,
        verdict: 'uncertain' as const,
        indicators: [],
        narrativeStructure: {
          hasPrologue: false,
          hasCoreEvent: true,
          hasEpilogue: false,
          missing: ['prologue', 'epilogue'],
          isComplete: false
        }
      };

      const report = generator.generateReport(input);

      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('confidence_interval');
      expect(report).toHaveProperty('verdict');
      expect(report).toHaveProperty('indicators');
      expect(report).toHaveProperty('sentence_flags');
      expect(report).toHaveProperty('narrative_structure');
      expect(report).toHaveProperty('summary');
    });
  });

  describe('Property 30: JSON Output Format', () => {
    it('should produce valid JSON output', () => {
      // Feature: lie-detector-nlp, Property 30: JSON Output Format
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (text, score) => {
            const input = {
              text,
              score,
              confidenceInterval: 15,
              verdict: 'uncertain' as const,
              indicators: [],
              narrativeStructure: {
                hasPrologue: false,
                hasCoreEvent: true,
                hasEpilogue: false,
                missing: ['prologue', 'epilogue'],
                isComplete: false
              }
            };

            const report = generator.generateReport(input);
            const json = generator.toJSON(report);
            const parsed = generator.fromJSON(json);

            expect(parsed.score).toBe(report.score);
            expect(parsed.verdict).toBe(report.verdict);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
