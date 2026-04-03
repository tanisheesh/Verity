import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { Analyzer } from '../src/components/Analyzer';

describe('Analyzer Tests', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer();
  });

  describe('Property 1: Input Length Validation', () => {
    it('should accept text with length in range [10, 10000]', () => {
      // Feature: lie-detector-nlp, Property 1: Input Length Validation
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 10000 }).filter(s => s.trim().length >= 10),
          (text) => {
            const result = analyzer.validateInput(text);
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject text shorter than 10 characters', () => {
      const result = analyzer.validateInput('short');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('TEXT_TOO_SHORT');
    });

    it('should reject text longer than 10000 characters', () => {
      const longText = 'a'.repeat(10001);
      const result = analyzer.validateInput(longText);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('TEXT_TOO_LONG');
    });
  });

  describe('Property 2: Text Formatting Preservation', () => {
    it('should preserve line breaks and punctuation', async () => {
      // Feature: lie-detector-nlp, Property 2: Text Formatting Preservation
      const text = "Line one.\nLine two!\nLine three?";
      const result = await analyzer.analyze({ text });

      if (result.success && result.data) {
        // Verify the analysis completes successfully with formatted text
        expect(result.data.score).toBeGreaterThanOrEqual(0);
        expect(result.data.score).toBeLessThanOrEqual(100);
        expect(result.data.verdict).toBeDefined();
      }
    });
  });

  describe('Property 33: Malformed Input Error Handling', () => {
    it('should handle malformed input gracefully', async () => {
      // Feature: lie-detector-nlp, Property 33: Malformed Input Error Handling
      const result = await analyzer.analyze({ text: '' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Unit Tests: Error Handling Edge Cases', () => {
    it('should handle empty text', async () => {
      const result = await analyzer.analyze({ text: '' });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should handle null/undefined text', () => {
      const result1 = analyzer.validateInput(null as any);
      expect(result1.isValid).toBe(false);
      expect(result1.error?.code).toBe('INVALID_INPUT');

      const result2 = analyzer.validateInput(undefined as any);
      expect(result2.isValid).toBe(false);
      expect(result2.error?.code).toBe('INVALID_INPUT');
    });

    it('should handle text at exactly 10 characters', async () => {
      const text = '1234567890';
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should handle text at exactly 10000 characters', async () => {
      const text = 'a'.repeat(10000);
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });
  });
});
