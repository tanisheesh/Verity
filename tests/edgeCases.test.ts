import { describe, it, expect, beforeEach } from 'vitest';
import { Analyzer } from '../src/components/Analyzer';

describe('Edge Case Tests', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer();
  });

  describe('Empty/Whitespace-only text', () => {
    it('should reject empty text', async () => {
      const result = await analyzer.analyze({ text: '' });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should reject whitespace-only text', async () => {
      const result = await analyzer.analyze({ text: '   \n\t  ' });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEXT_TOO_SHORT');
    });
  });

  describe('Special characters', () => {
    it('should handle text with special characters', async () => {
      const text = "I went to the café and bought a piñata for $50! It's amazing.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should handle text with emojis', async () => {
      const text = "I am so happy today 😊 Everything is going great! 🎉";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should handle text with quotes and apostrophes', async () => {
      const text = `He said "I'm going to the store" but didn't actually go.`;
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should handle text with newlines and tabs', async () => {
      const text = "Line one.\n\tLine two with tab.\nLine three.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });
  });

  describe('Boundary values', () => {
    it('should accept text with exactly 10 characters', async () => {
      const text = '1234567890';
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should reject text with 9 characters', async () => {
      const text = '123456789';
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEXT_TOO_SHORT');
    });

    it('should accept text with exactly 10000 characters', async () => {
      const text = 'a'.repeat(10000);
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should reject text with 10001 characters', async () => {
      const text = 'a'.repeat(10001);
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEXT_TOO_LONG');
    });
  });

  describe('Insufficient pronouns', () => {
    it('should handle text with fewer than 3 pronouns', async () => {
      const text = "The meeting happened yesterday at the office building.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
      // Should not flag pronoun distancing with < 3 pronouns
    });

    it('should handle text with no pronouns', async () => {
      const text = "The quick brown fox jumps over the lazy dog.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });
  });

  describe('Multi-line text formats', () => {
    it('should handle Unix line breaks (LF)', async () => {
      const text = "Line one.\nLine two.\nLine three.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should handle Windows line breaks (CRLF)', async () => {
      const text = "Line one.\r\nLine two.\r\nLine three.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should handle mixed line breaks', async () => {
      const text = "Line one.\nLine two.\r\nLine three.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });
  });

  describe('Unicode and international characters', () => {
    it('should handle Chinese characters', async () => {
      const text = "I went to Beijing 北京 yesterday and met some friends.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should handle Arabic characters', async () => {
      const text = "I visited Dubai دبي and had a great time there.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should handle Cyrillic characters', async () => {
      const text = "I traveled to Moscow Москва and explored the city.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });
  });

  describe('HTML and special markup', () => {
    it('should handle text with HTML entities', async () => {
      const text = "I said &quot;hello&quot; and he replied &amp; smiled.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });

    it('should handle text with angle brackets', async () => {
      const text = "The value is <10 and >5 which means it's in range.";
      const result = await analyzer.analyze({ text });
      expect(result.success).toBe(true);
    });
  });
});
