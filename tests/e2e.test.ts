/**
 * End-to-End Integration Tests
 * 
 * Tests the complete analysis pipeline with known samples to validate
 * the 9-layer analysis system produces expected results.
 */

import { describe, it, expect } from 'vitest';
import { Analyzer } from '../src/components/Analyzer';
import {
  deceptiveSamples,
  truthfulSamples,
  edgeCaseSamples,
  type KnownSample
} from './fixtures/known-samples';

describe('End-to-End Integration Tests', () => {
  const analyzer = new Analyzer();

  describe('Deceptive Samples', () => {
    deceptiveSamples.forEach((sample: KnownSample) => {
      describe(`Sample: ${sample.id}`, () => {
        it(`should detect deception with score >= ${sample.expectedMinScore || 45}`, async () => {
          const startTime = performance.now();
          const output = await analyzer.analyze({ text: sample.text });
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Extract result from output
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify analysis completed successfully
          expect(result).toBeDefined();
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);

          // Verify score meets minimum threshold
          const minScore = sample.expectedMinScore || 45;
          expect(result.score).toBeGreaterThanOrEqual(minScore);

          // Verify performance requirement: < 500ms
          expect(duration).toBeLessThan(500);

          console.log(`✓ ${sample.id}: score=${result.score}, duration=${duration.toFixed(2)}ms`);
        });

        it(`should detect expected indicators: ${sample.expectedIndicators.join(', ')}`, async () => {
          const output = await analyzer.analyze({ text: sample.text });
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify indicators array exists
          expect(result.indicators).toBeDefined();
          expect(Array.isArray(result.indicators)).toBe(true);

          // Extract indicator names from result
          const detectedIndicatorNames = result.indicators.map(ind => ind.name);

          // Verify each expected indicator is detected
          sample.expectedIndicators.forEach(expectedIndicator => {
            // Normalize both strings: replace underscores with spaces and lowercase
            const normalizedExpected = expectedIndicator.replace(/_/g, ' ').toLowerCase();
            const isDetected = detectedIndicatorNames.some(name =>
              name.toLowerCase().includes(normalizedExpected) ||
              normalizedExpected.includes(name.toLowerCase())
            );

            expect(isDetected).toBe(true);
          });

          console.log(`✓ ${sample.id}: detected indicators=${detectedIndicatorNames.join(', ')}`);
        });

        it('should include confidence interval and summary', async () => {
          const output = await analyzer.analyze({ text: sample.text });
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify confidence interval exists and is reasonable
          expect(result.confidence_interval).toBeDefined();
          expect(result.confidence_interval).toBeGreaterThanOrEqual(5);
          expect(result.confidence_interval).toBeLessThanOrEqual(20);

          // Verify summary exists and is not empty
          expect(result.summary).toBeDefined();
          expect(result.summary.length).toBeGreaterThan(0);
          expect(result.summary.split(' ').length).toBeGreaterThanOrEqual(10); // At least 10 words

          console.log(`✓ ${sample.id}: summary="${result.summary.substring(0, 80)}..."`);
        });

        it('should include sentence-level flags', async () => {
          const output = await analyzer.analyze({ text: sample.text });
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify sentence_flags array exists
          expect(result.sentence_flags).toBeDefined();
          expect(Array.isArray(result.sentence_flags)).toBe(true);

          // For deceptive samples, expect at least some flagged sentences
          expect(result.sentence_flags.length).toBeGreaterThan(0);

          // Verify structure of sentence flags
          result.sentence_flags.forEach(flag => {
            expect(flag.sentence).toBeDefined();
            expect(typeof flag.sentence).toBe('string');
            expect(flag.index).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(flag.flags)).toBe(true);
            expect(flag.flags.length).toBeGreaterThan(0);
            expect(['low', 'medium', 'high']).toContain(flag.severity);
          });
        });

        it('should include narrative structure information', async () => {
          const output = await analyzer.analyze({ text: sample.text });
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify narrative_structure exists
          expect(result.narrative_structure).toBeDefined();
          expect(typeof result.narrative_structure.has_prologue).toBe('boolean');
          expect(typeof result.narrative_structure.has_epilogue).toBe('boolean');
          expect(Array.isArray(result.narrative_structure.missing)).toBe(true);
        });
      });
    });
  });

  describe('Truthful Samples', () => {
    truthfulSamples.forEach((sample: KnownSample) => {
      describe(`Sample: ${sample.id}`, () => {
        it(`should show minimal deception with score <= 33 (likely_truthful verdict)`, async () => {
          const startTime = performance.now();
          const output = await analyzer.analyze({ text: sample.text });
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Extract result from output
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify analysis completed successfully
          expect(result).toBeDefined();
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);

          // Verify verdict is "likely_truthful"
          expect(result.verdict).toBe('likely_truthful');

          // Verify score is <= 33
          if (sample.expectedMaxScore !== undefined) {
            expect(result.score).toBeLessThanOrEqual(sample.expectedMaxScore);
          } else {
            expect(result.score).toBeLessThanOrEqual(33);
          }

          // Verify performance requirement: < 500ms
          expect(duration).toBeLessThan(500);

          console.log(`✓ ${sample.id}: score=${result.score}, duration=${duration.toFixed(2)}ms`);
        });

        it('should detect minimal or no indicators', async () => {
          const output = await analyzer.analyze({ text: sample.text });
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify indicators array exists
          expect(result.indicators).toBeDefined();
          expect(Array.isArray(result.indicators)).toBe(true);

          // For truthful samples, expect few or no indicators
          expect(result.indicators.length).toBeLessThanOrEqual(2);

          console.log(`✓ ${sample.id}: indicator count=${result.indicators.length}`);
        });

        it('should include confidence interval and summary', async () => {
          const output = await analyzer.analyze({ text: sample.text });
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify confidence interval exists and is reasonable
          expect(result.confidence_interval).toBeDefined();
          expect(result.confidence_interval).toBeGreaterThanOrEqual(5);
          expect(result.confidence_interval).toBeLessThanOrEqual(20);

          // Verify summary exists and is not empty
          expect(result.summary).toBeDefined();
          expect(result.summary.length).toBeGreaterThan(0);

          console.log(`✓ ${sample.id}: summary="${result.summary.substring(0, 80)}..."`);
        });

        it('should have minimal or no sentence flags', async () => {
          const output = await analyzer.analyze({ text: sample.text });
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify sentence_flags array exists
          expect(result.sentence_flags).toBeDefined();
          expect(Array.isArray(result.sentence_flags)).toBe(true);

          // For truthful samples, expect few or no flagged sentences
          expect(result.sentence_flags.length).toBeLessThanOrEqual(2);
        });

        it('should include narrative structure information', async () => {
          const output = await analyzer.analyze({ text: sample.text });
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify narrative_structure exists
          expect(result.narrative_structure).toBeDefined();
          expect(typeof result.narrative_structure.has_prologue).toBe('boolean');
          expect(typeof result.narrative_structure.has_epilogue).toBe('boolean');
          expect(Array.isArray(result.narrative_structure.missing)).toBe(true);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    edgeCaseSamples.forEach((sample: KnownSample) => {
      describe(`Sample: ${sample.id}`, () => {
        it(`should handle edge case: ${sample.description}`, async () => {
          const startTime = performance.now();
          const output = await analyzer.analyze({ text: sample.text });
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Extract result from output
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify analysis completed successfully
          expect(result).toBeDefined();
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);

          // Verify verdict matches expected
          expect(result.verdict).toBe(sample.expectedVerdict);

          // Verify score is within expected range
          if (sample.expectedMinScore !== undefined) {
            expect(result.score).toBeGreaterThanOrEqual(sample.expectedMinScore);
          }
          if (sample.expectedMaxScore !== undefined) {
            expect(result.score).toBeLessThanOrEqual(sample.expectedMaxScore);
          }

          // Verify performance requirement: < 500ms
          expect(duration).toBeLessThan(500);

          console.log(`✓ ${sample.id}: score=${result.score}, verdict=${result.verdict}, duration=${duration.toFixed(2)}ms`);
        });

        it('should return valid report structure', async () => {
          const output = await analyzer.analyze({ text: sample.text });
          expect(output.success).toBe(true);
          const result = output.data!;

          // Verify all required fields exist
          expect(result.score).toBeDefined();
          expect(result.confidence_interval).toBeDefined();
          expect(result.verdict).toBeDefined();
          expect(result.indicators).toBeDefined();
          expect(result.sentence_flags).toBeDefined();
          expect(result.narrative_structure).toBeDefined();
          expect(result.summary).toBeDefined();

          // Verify types
          expect(typeof result.score).toBe('number');
          expect(typeof result.confidence_interval).toBe('number');
          expect(typeof result.verdict).toBe('string');
          expect(Array.isArray(result.indicators)).toBe(true);
          expect(Array.isArray(result.sentence_flags)).toBe(true);
          expect(typeof result.narrative_structure).toBe('object');
          expect(typeof result.summary).toBe('string');
        });
      });
    });
  });

  describe('Performance Tests', () => {
    it('should analyze short text (10 chars) in < 500ms', async () => {
      const shortText = 'I went there.';
      const startTime = performance.now();
      const output = await analyzer.analyze({ text: shortText });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(output.success).toBe(true);
      expect(duration).toBeLessThan(500);
      console.log(`✓ Short text (${shortText.length} chars): ${duration.toFixed(2)}ms`);
    });

    it('should analyze medium text (1000 chars) in < 500ms', async () => {
      // Generate ~1000 character text
      const mediumText = `Before the conference, I spent several weeks preparing my presentation on sustainable 
      architecture and green building practices. I researched the latest developments in energy-efficient design, 
      reviewed case studies from successful projects around the world, and compiled data on cost savings and 
      environmental impact. During the conference, I presented my findings to an audience of approximately 
      two hundred architects, engineers, and urban planners. I explained the principles of passive solar design, 
      demonstrated innovative insulation techniques, and discussed the integration of renewable energy systems 
      in residential and commercial buildings. The audience asked thoughtful questions about implementation 
      challenges, regulatory requirements, and return on investment calculations. After my presentation, 
      I participated in panel discussions with other experts in the field, exchanged ideas with colleagues 
      from different countries, and established valuable professional connections that would benefit my future projects.`;
      
      const startTime = performance.now();
      const output = await analyzer.analyze({ text: mediumText });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(output.success).toBe(true);
      expect(duration).toBeLessThan(500);
      console.log(`✓ Medium text (${mediumText.length} chars): ${duration.toFixed(2)}ms`);
    });

    it('should analyze long text (10000 chars) in < 1500ms', async () => {
      // Generate ~10000 character text by repeating a complex narrative
      const baseText = `Before the major product launch, our team spent six months developing and refining 
      the new software platform. We conducted extensive market research, analyzed competitor offerings, 
      and gathered feedback from potential users through surveys and focus groups. The development process 
      involved multiple iterations, with each version incorporating improvements based on user testing results. 
      During the launch event, we demonstrated the platform's key features to an audience of industry professionals, 
      journalists, and potential investors. The presentation highlighted the innovative user interface, 
      advanced security features, and seamless integration capabilities with existing systems. After the launch, 
      we monitored user adoption rates, collected feedback through various channels, and prepared for the next 
      phase of development based on real-world usage patterns and customer requests. `;
      
      const longText = baseText.repeat(10); // Approximately 10000 characters
      
      const startTime = performance.now();
      const output = await analyzer.analyze({ text: longText });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(output.success).toBe(true);
      expect(duration).toBeLessThan(1500);
      console.log(`✓ Long text (${longText.length} chars): ${duration.toFixed(2)}ms`);
    });
  });

  describe('Error Handling', () => {
    it('should handle text that is too short (< 10 chars)', async () => {
      const tooShort = 'Hi there';
      
      const output = await analyzer.analyze({ text: tooShort });
      
      // Should either return error or analyze with warning
      if (!output.success) {
        expect(output.error).toBeDefined();
        expect(output.error?.message).toBeDefined();
      } else {
        // If it analyzes anyway, result should be valid
        expect(output.data).toBeDefined();
      }
    });

    it('should handle empty text gracefully', async () => {
      const emptyText = '';
      
      const output = await analyzer.analyze({ text: emptyText });
      
      // Should return error for empty text
      expect(output.success).toBe(false);
      expect(output.error).toBeDefined();
    });

    it('should handle text with only whitespace', async () => {
      const whitespaceText = '     \n\n\t\t   ';
      
      const output = await analyzer.analyze({ text: whitespaceText });
      
      // Should return error for whitespace-only text
      expect(output.success).toBe(false);
      expect(output.error).toBeDefined();
    });

    it('should handle text with special characters', async () => {
      const specialCharsText = 'I went to the store! Did you see that? #amazing @john';
      
      const output = await analyzer.analyze({ text: specialCharsText });
      expect(output.success).toBe(true);
      const result = output.data!;
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle text with unicode characters', async () => {
      const unicodeText = 'I went to the café and ordered a latté. The weather was 25°C.';
      
      const output = await analyzer.analyze({ text: unicodeText });
      expect(output.success).toBe(true);
      const result = output.data!;
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('JSON Serialization', () => {
    it('should produce valid JSON output for all samples', async () => {
      for (const sample of [...deceptiveSamples, ...truthfulSamples]) {
        const output = await analyzer.analyze({ text: sample.text });
        expect(output.success).toBe(true);
        const result = output.data!;
        
        // Serialize to JSON and parse back
        const jsonString = JSON.stringify(result);
        expect(jsonString).toBeDefined();
        expect(jsonString.length).toBeGreaterThan(0);
        
        const parsed = JSON.parse(jsonString);
        expect(parsed).toBeDefined();
        expect(parsed.score).toBe(result.score);
        expect(parsed.verdict).toBe(result.verdict);
        expect(parsed.confidence_interval).toBe(result.confidence_interval);
      }
    });

    it('should handle special characters in text fields without breaking JSON', async () => {
      const textWithSpecialChars = 'He said "I didn\'t do it!" but I wasn\'t sure. The report stated: "inconclusive".';
      
      const output = await analyzer.analyze({ text: textWithSpecialChars });
      expect(output.success).toBe(true);
      const result = output.data!;
      
      const jsonString = JSON.stringify(result);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed).toBeDefined();
      expect(parsed.score).toBeDefined();
    });
  });
});
