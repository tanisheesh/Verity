import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { SentimentAnalyzer } from '../src/components/SentimentAnalyzer';

describe('SentimentAnalyzer Tests', () => {
  let analyzer: SentimentAnalyzer;

  beforeEach(() => {
    analyzer = new SentimentAnalyzer();
  });

  describe('Property 14: Sentiment Score Range', () => {
    it('should return sentiment scores within -1 to +1 range', () => {
      // Feature: lie-detector-nlp, Property 14: Sentiment Score Range
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 200 }),
          (text) => {
            const result = analyzer.analyze(text);
            
            expect(result.overallPolarity).toBeGreaterThanOrEqual(-1);
            expect(result.overallPolarity).toBeLessThanOrEqual(1);
            
            result.sentenceScores.forEach(score => {
              expect(score.polarity).toBeGreaterThanOrEqual(-1);
              expect(score.polarity).toBeLessThanOrEqual(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Per-Sentence Sentiment Scoring', () => {
    it('should calculate sentiment for each sentence', () => {
      // Feature: lie-detector-nlp, Property 15: Per-Sentence Sentiment Scoring
      const text = "I am happy. This is terrible. Everything is okay.";
      const result = analyzer.analyze(text);
      
      expect(result.sentenceScores.length).toBeGreaterThan(0);
      result.sentenceScores.forEach(score => {
        expect(score).toHaveProperty('sentenceIndex');
        expect(score).toHaveProperty('text');
        expect(score).toHaveProperty('polarity');
      });
    });
  });

  describe('Property 16: Sentiment Shift Detection', () => {
    it('should detect sentiment shifts > 1.0', () => {
      // Feature: lie-detector-nlp, Property 16: Sentiment Shift Detection
      const text = "I am extremely happy and joyful. This is absolutely terrible and awful.";
      const result = analyzer.analyze(text);
      
      result.shifts.forEach(shift => {
        expect(shift.magnitude).toBeGreaterThan(0);
        expect(shift).toHaveProperty('fromSentence');
        expect(shift).toHaveProperty('toSentence');
      });
    });
  });
});
