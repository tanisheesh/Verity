import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { NarrativeStructureAnalyzer } from '../src/components/NarrativeStructureAnalyzer';

describe('NarrativeStructureAnalyzer Tests', () => {
  let analyzer: NarrativeStructureAnalyzer;

  beforeEach(() => {
    analyzer = new NarrativeStructureAnalyzer();
  });

  // ========== PROPERTY TESTS FOR TASK 4 ==========

  describe('Property 16: Incomplete Narrative Structure Detection', () => {
    it('should flag narratives missing prologue or epilogue', () => {
      // **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
      fc.assert(
        fc.property(
          fc.constantFrom(
            // Missing prologue (>= 6 sentences)
            "I grabbed the keys. I drove to work. I parked the car. The day started. Work continued. After that, I went home.",
            // Missing epilogue (>= 6 sentences)
            "Before I left, I checked my phone. Earlier that day, I was at home. I decided to go out. I drove away. The trip started. I arrived there.",
            // Missing both (>= 6 sentences)
            "The meeting happened. We discussed the project. Everyone agreed. More topics came up. Decisions were made. The session ended.",
            // Complete narrative (>= 6 sentences)
            "Earlier that morning, I was at home. I decided to go to the store. I bought groceries. I returned home. After that, I realized I forgot my wallet. Later, I went back.",
            // Short text (< 6 sentences) - should not be flagged
            "The event occurred suddenly. People were surprised. Later, I learned what happened."
          ),
          (text) => {
            const result = analyzer.analyze(text);
            
            // Should have all required fields
            expect(typeof result.hasPrologue).toBe('boolean');
            expect(typeof result.hasCoreEvent).toBe('boolean');
            expect(typeof result.hasEpilogue).toBe('boolean');
            expect(Array.isArray(result.missing)).toBe(true);
            expect(typeof result.isComplete).toBe('boolean');
            
            // Count sentences
            const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            
            // If text has < 6 sentences, should not be flagged (inconclusive)
            if (sentenceCount < 6) {
              expect(result.isComplete).toBe(true);
              expect(result.missing.length).toBe(0);
              return;
            }
            
            // For texts with >= 6 sentences:
            // If missing prologue, it should be in missing array
            if (!result.hasPrologue) {
              expect(result.missing).toContain('prologue');
            }
            
            // If missing epilogue, it should be in missing array
            if (!result.hasEpilogue) {
              expect(result.missing).toContain('epilogue');
            }
            
            // isComplete should be true only if nothing is missing
            if (result.isComplete) {
              expect(result.missing.length).toBe(0);
              expect(result.hasPrologue).toBe(true);
              expect(result.hasEpilogue).toBe(true);
            } else {
              expect(result.missing.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect prologue markers correctly', () => {
      // **Validates: Requirements 7.1**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "Before the incident, I was at home. Something happened. The event unfolded. We responded. Actions were taken. The situation resolved.",
            "Earlier that day, we were in the office. The meeting started. Discussion continued. Topics were covered. Decisions were made. The session ended.",
            "Previously, I had checked the documents. Then I noticed an error. I investigated further. The issue was identified. Corrections were made. The problem was fixed.",
            "That morning, the situation was calm. Everything changed quickly. Events accelerated. We adapted. The team responded. Resolution was achieved.",
            "I was at the store when it happened. I saw everything. The incident occurred. People reacted. Help arrived. The situation stabilized."
          ),
          (text) => {
            const result = analyzer.analyze(text);
            
            // Should detect prologue
            expect(result.hasPrologue).toBe(true);
            expect(result.prologueRange).toBeDefined();
            
            if (result.prologueRange) {
              expect(typeof result.prologueRange.start).toBe('number');
              expect(typeof result.prologueRange.end).toBe('number');
              expect(result.prologueRange.start).toBeLessThanOrEqual(result.prologueRange.end);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect epilogue markers correctly', () => {
      // **Validates: Requirements 7.3**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "The event happened. Things unfolded. Actions were taken. We responded. After that, I realized my mistake. The lesson was learned.",
            "Something occurred. The situation developed. We dealt with it. Responses were made. Then I learned the truth. Understanding came.",
            "It took place yesterday. Events transpired. We handled it. The team worked. Later, I discovered what went wrong. Clarity emerged.",
            "The incident unfolded. Things changed. We adapted. Actions followed. Since then, I have been more careful. Improvement happened.",
            "Things changed. The situation evolved. We responded. Decisions were made. Afterwards, I understood the situation better. Knowledge grew."
          ),
          (text) => {
            const result = analyzer.analyze(text);
            
            // Should detect epilogue
            expect(result.hasEpilogue).toBe(true);
            expect(result.epilogueRange).toBeDefined();
            
            if (result.epilogueRange) {
              expect(typeof result.epilogueRange.start).toBe('number');
              expect(typeof result.epilogueRange.end).toBe('number');
              expect(result.epilogueRange.start).toBeLessThanOrEqual(result.epilogueRange.end);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 17: Narrative Structure Output Completeness', () => {
    it('should return complete NarrativeStructureAnalysis object', () => {
      // **Validates: Requirements 7.5, 7.6**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "Before I left, I was at home. I went to the store. I bought milk. I returned home. After that, I realized I forgot my wallet. Later, I went back.",
            "The meeting started. We discussed the agenda. Everyone participated. Topics were covered. Decisions were made. The session concluded.",
            "Earlier, the weather was nice. It started raining. The storm intensified. We took shelter. Then it stopped. The sun returned.",
            "I was working. Something happened. The situation changed. We responded. Later, I understood. The lesson was clear.",
            "Previously, things were different. The situation changed. Events unfolded. We adapted. Since then, I have adapted. Progress was made."
          ),
          (text) => {
            const result = analyzer.analyze(text);
            
            // Should have all required boolean fields
            expect(result).toHaveProperty('hasPrologue');
            expect(result).toHaveProperty('hasCoreEvent');
            expect(result).toHaveProperty('hasEpilogue');
            expect(result).toHaveProperty('isComplete');
            
            // Should have missing array
            expect(result).toHaveProperty('missing');
            expect(Array.isArray(result.missing)).toBe(true);
            
            // Should have range fields (optional)
            if (result.hasPrologue) {
              expect(result.prologueRange).toBeDefined();
            }
            if (result.hasCoreEvent) {
              expect(result.coreEventRange).toBeDefined();
            }
            if (result.hasEpilogue) {
              expect(result.epilogueRange).toBeDefined();
            }
            
            // missing array should only contain valid values
            result.missing.forEach(item => {
              expect(['prologue', 'epilogue']).toContain(item);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases gracefully', () => {
      // **Validates: Requirements 7.1-7.6**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "", // Empty string
            "Single sentence.",
            "Two sentences. That's all.",
            "A", // Very short
            "Before. After. Then." // Only markers
          ),
          (text) => {
            const result = analyzer.analyze(text);
            
            // Should not throw and return valid structure
            expect(result).toBeDefined();
            expect(typeof result.hasPrologue).toBe('boolean');
            expect(typeof result.hasCoreEvent).toBe('boolean');
            expect(typeof result.hasEpilogue).toBe('boolean');
            expect(Array.isArray(result.missing)).toBe(true);
            expect(typeof result.isComplete).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 18: Narrative Segmentation', () => {
    it('should segment narrative into distinct sections', () => {
      // **Validates: Requirements 7.1, 7.2, 7.3**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "Before the meeting, I prepared my notes. Earlier, I reviewed the agenda. The meeting started at 9am. We discussed the project. Everyone contributed ideas. After the meeting, I realized we made progress. Later, I sent a summary email.",
            "Previously, I was unaware of the issue. That morning, I was at the office. The problem became apparent. I investigated the cause. I found the solution. Since then, I have implemented fixes.",
            "I was at home when it started. Before that, everything was normal. The event unfolded quickly. Things changed rapidly. Afterwards, I understood what happened. Then I took action."
          ),
          (text) => {
            const result = analyzer.analyze(text);
            
            // If ranges are defined, they should not overlap incorrectly
            if (result.prologueRange && result.coreEventRange) {
              // Prologue should come before or at the start of core
              expect(result.prologueRange.start).toBeLessThanOrEqual(result.coreEventRange.start);
            }
            
            if (result.coreEventRange && result.epilogueRange) {
              // Core should come before or at the start of epilogue
              expect(result.coreEventRange.start).toBeLessThanOrEqual(result.epilogueRange.start);
            }
            
            // All ranges should have valid indices
            if (result.prologueRange) {
              expect(result.prologueRange.start).toBeGreaterThanOrEqual(0);
              expect(result.prologueRange.end).toBeGreaterThanOrEqual(result.prologueRange.start);
            }
            
            if (result.coreEventRange) {
              expect(result.coreEventRange.start).toBeGreaterThanOrEqual(0);
              expect(result.coreEventRange.end).toBeGreaterThanOrEqual(result.coreEventRange.start);
            }
            
            if (result.epilogueRange) {
              expect(result.epilogueRange.start).toBeGreaterThanOrEqual(0);
              expect(result.epilogueRange.end).toBeGreaterThanOrEqual(result.epilogueRange.start);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify section boundaries', () => {
      // **Validates: Requirements 7.1, 7.2, 7.3**
      const completeNarrative = "Before I left home, I checked the weather. Earlier that morning, I was preparing for the trip. I drove to the destination. The journey took two hours. I arrived safely. After arriving, I realized I had a great time. Later, I reflected on the experience.";
      
      const result = analyzer.analyze(completeNarrative);
      
      // Should detect all three sections
      expect(result.hasPrologue).toBe(true);
      expect(result.hasCoreEvent).toBe(true);
      expect(result.hasEpilogue).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.missing.length).toBe(0);
      
      // Should have all ranges defined
      expect(result.prologueRange).toBeDefined();
      expect(result.coreEventRange).toBeDefined();
      expect(result.epilogueRange).toBeDefined();
    });
  });

  // ========== UNIT TESTS ==========

  describe('Unit Tests: Narrative Structure Analysis', () => {
    it('should detect complete narrative with all components', () => {
      const text = "Before the incident, I was at home. Earlier, I had been working. The event occurred suddenly. I reacted quickly. After that, I realized what happened. Later, I learned from the experience.";
      const result = analyzer.analyze(text);
      
      expect(result.hasPrologue).toBe(true);
      expect(result.hasCoreEvent).toBe(true);
      expect(result.hasEpilogue).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.missing.length).toBe(0);
    });

    it('should detect missing prologue', () => {
      // Text with >= 6 sentences but missing prologue
      const text = "The event happened. Things changed. We discussed it. Everyone agreed. After that, I understood the situation. Later, I learned more.";
      const result = analyzer.analyze(text);
      
      expect(result.hasPrologue).toBe(false);
      expect(result.missing).toContain('prologue');
      expect(result.isComplete).toBe(false);
    });

    it('should detect missing epilogue', () => {
      // Text with >= 6 sentences but missing epilogue
      const text = "Before the meeting, I prepared. Earlier, I reviewed notes. The meeting started. We discussed topics. Everyone participated. The discussion continued.";
      const result = analyzer.analyze(text);
      
      expect(result.hasEpilogue).toBe(false);
      expect(result.missing).toContain('epilogue');
      expect(result.isComplete).toBe(false);
    });

    it('should detect missing both prologue and epilogue', () => {
      // Text with >= 6 sentences but missing both prologue and epilogue
      const text = "The meeting happened. We talked. Everyone agreed. The discussion continued. More topics were covered. The session ended.";
      const result = analyzer.analyze(text);
      
      expect(result.hasPrologue).toBe(false);
      expect(result.hasEpilogue).toBe(false);
      expect(result.missing).toContain('prologue');
      expect(result.missing).toContain('epilogue');
      expect(result.isComplete).toBe(false);
    });

    it('should handle empty text', () => {
      const result = analyzer.analyze("");
      
      expect(result.hasPrologue).toBe(false);
      expect(result.hasCoreEvent).toBe(false);
      expect(result.hasEpilogue).toBe(false);
      expect(result.isComplete).toBe(false);
    });

    it('should handle single sentence', () => {
      // Short text (< 6 sentences) should not be flagged
      const result = analyzer.analyze("Something happened.");
      
      expect(result).toBeDefined();
      expect(typeof result.isComplete).toBe('boolean');
      // Short texts are not flagged (inconclusive)
      expect(result.isComplete).toBe(true);
      expect(result.missing.length).toBe(0);
    });

    it('should detect temporal prologue markers', () => {
      // Text with >= 6 sentences and temporal prologue markers
      const text = "Previously, I was unaware. The situation changed. Things are different now. We adapted quickly. Everyone adjusted. The process completed.";
      const result = analyzer.analyze(text);
      
      expect(result.hasPrologue).toBe(true);
    });

    it('should detect setting prologue markers', () => {
      // Text with >= 6 sentences and setting prologue markers
      const text = "I was at the office when it started. The alarm went off. Everyone evacuated. We gathered outside. The situation was assessed. Safety was confirmed.";
      const result = analyzer.analyze(text);
      
      expect(result.hasPrologue).toBe(true);
    });

    it('should detect consequence epilogue markers', () => {
      // Text with >= 6 sentences and consequence epilogue markers
      const text = "The event occurred. Things changed. We responded quickly. Actions were taken. Then I understood what happened. The resolution was clear.";
      const result = analyzer.analyze(text);
      
      expect(result.hasEpilogue).toBe(true);
    });

    it('should detect reflection epilogue markers', () => {
      // Text with >= 6 sentences and reflection epilogue markers
      const text = "Something happened. It was unexpected. We dealt with it. The team responded. I realized the importance of preparation. The lesson was valuable.";
      const result = analyzer.analyze(text);
      
      expect(result.hasEpilogue).toBe(true);
    });
  });
});
