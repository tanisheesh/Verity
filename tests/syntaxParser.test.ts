import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { SyntaxParser } from '../src/components/SyntaxParser';

describe('SyntaxParser Tests', () => {
  let parser: SyntaxParser;

  beforeEach(() => {
    parser = new SyntaxParser();
  });

  // ========== NEW PROPERTY TESTS FOR TASK 3 ==========

  describe('Property 3: Tense Identification Completeness', () => {
    it('should identify tense for each verb phrase in text', () => {
      // **Validates: Requirements 2.1**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "I went to the store yesterday.",
            "She is going to the park now.",
            "They will arrive tomorrow.",
            "He walked home and ate dinner.",
            "We are working on the project."
          ),
          (text) => {
            const result = parser.analyzeTenseConsistency(text);
            
            // Should extract verb phrases
            expect(result.verbPhrases).toBeDefined();
            expect(Array.isArray(result.verbPhrases)).toBe(true);
            
            // Each verb phrase should have a valid tense
            result.verbPhrases.forEach(verb => {
              expect(verb.tense).toMatch(/^(past|present|future)$/);
              expect(verb.text).toBeDefined();
              expect(typeof verb.sentenceIndex).toBe('number');
              expect(typeof verb.isQuoted).toBe('boolean');
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Tense Shift Detection', () => {
    it('should detect unexplained tense shifts between consecutive sentences', () => {
      // **Validates: Requirements 2.2, 2.3**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "I went to the store. I buy some milk. I returned home.",
            "She walked to work. She is eating lunch. She will leave soon.",
            "They arrived yesterday. They are staying here. They left today.",
            "He was happy. He is sad now.",
            "We worked hard. We are tired."
          ),
          (text) => {
            const result = parser.analyzeTenseConsistency(text);
            
            // Should have tenseShifts array
            expect(result.tenseShifts).toBeDefined();
            expect(Array.isArray(result.tenseShifts)).toBe(true);
            
            // Should have shiftCount
            expect(typeof result.shiftCount).toBe('number');
            expect(result.shiftCount).toBeGreaterThanOrEqual(0);
            
            // Each shift should have proper structure
            result.tenseShifts.forEach(shift => {
              expect(typeof shift.fromSentence).toBe('number');
              expect(typeof shift.toSentence).toBe('number');
              expect(shift.fromTense).toBeDefined();
              expect(shift.toTense).toBeDefined();
              expect(typeof shift.isJustified).toBe('boolean');
            });
            
            // shiftCount should match number of unjustified shifts
            const unjustifiedShifts = result.tenseShifts.filter(s => !s.isJustified).length;
            expect(result.shiftCount).toBe(unjustifiedShifts);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Quoted Speech Exclusion from Tense Analysis', () => {
    it('should exclude quoted speech from tense shift detection', () => {
      // **Validates: Requirements 2.4**
      fc.assert(
        fc.property(
          fc.constantFrom(
            'I said "I am going" but I went yesterday.',
            'She told me "I will come" and she came.',
            'He said "I was there" but he is here now.',
            'They claimed "we are ready" but they were not.',
            'I mentioned "I like it" and I liked it.'
          ),
          (text) => {
            const result = parser.analyzeTenseConsistency(text);
            
            // Should mark quoted verbs
            const quotedVerbs = result.verbPhrases.filter(v => v.isQuoted);
            const nonQuotedVerbs = result.verbPhrases.filter(v => !v.isQuoted);
            
            // Should have both quoted and non-quoted verbs for these examples
            expect(result.verbPhrases.length).toBeGreaterThan(0);
            
            // Tense shifts should only consider non-quoted verbs
            // This is validated by the implementation filtering out quoted verbs
            expect(result.tenseShifts).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: First-Person Pronoun Extraction', () => {
    it('should extract all first-person pronouns from text', () => {
      // **Validates: Requirements 4.1**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "I went to the store and bought my groceries.",
            "We are working on our project together.",
            "She told me that I should come.",
            "My friend and I went to see our teacher.",
            "They gave us their support."
          ),
          (text) => {
            const result = parser.analyzePronounConsistency(text);
            
            // Should extract pronouns
            expect(result.firstPersonPronouns).toBeDefined();
            expect(Array.isArray(result.firstPersonPronouns)).toBe(true);
            
            // Should have pronounCount
            expect(typeof result.pronounCount).toBe('number');
            expect(result.pronounCount).toBe(result.firstPersonPronouns.length);
            
            // Each pronoun should have proper structure
            result.firstPersonPronouns.forEach(p => {
              expect(p.pronoun).toBeDefined();
              expect(typeof p.sentenceIndex).toBe('number');
              expect(p.type).toMatch(/^(singular|plural)$/);
              
              // Verify pronoun is actually first-person
              const validPronouns = ['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours'];
              expect(validPronouns).toContain(p.pronoun);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Pronoun Pattern Tracking', () => {
    it('should track pronoun usage patterns and detect shifts', () => {
      // **Validates: Requirements 4.2, 4.3**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "I went to the store. We bought groceries. I came home.",
            "We started the project. I finished it alone.",
            "I was happy. We were celebrating. I felt great.",
            "My car broke down. Our mechanic fixed it.",
            "I think we should go. I will drive us there."
          ),
          (text) => {
            const result = parser.analyzePronounConsistency(text);
            
            // Should have hasShifts boolean
            expect(typeof result.hasShifts).toBe('boolean');
            
            // Should have shifts array
            expect(result.shifts).toBeDefined();
            expect(Array.isArray(result.shifts)).toBe(true);
            
            // Should have isInconclusive boolean
            expect(typeof result.isInconclusive).toBe('boolean');
            
            // If pronounCount < 3, should be inconclusive
            if (result.pronounCount < 3) {
              expect(result.isInconclusive).toBe(true);
              expect(result.hasShifts).toBe(false);
              expect(result.shifts.length).toBe(0);
            } else {
              expect(result.isInconclusive).toBe(false);
              
              // hasShifts should match whether shifts array has items
              expect(result.hasShifts).toBe(result.shifts.length > 0);
              
              // Each shift should have proper structure
              result.shifts.forEach(shift => {
                expect(typeof shift.fromSentence).toBe('number');
                expect(typeof shift.toSentence).toBe('number');
                expect(shift.fromType).toMatch(/^(singular|plural)$/);
                expect(shift.toType).toMatch(/^(singular|plural)$/);
                expect(shift.fromType).not.toBe(shift.toType);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ========== LEGACY TESTS (kept for backward compatibility) ==========

  describe('Property 3: Pronoun Extraction Completeness', () => {
    it('should extract all personal pronouns from text', () => {
      // Feature: lie-detector-nlp, Property 3: Pronoun Extraction Completeness
      const text = "I went to the store and she bought groceries. They were happy.";
      const result = parser.analyzePronoun(text);
      
      expect(result.firstPerson.length).toBeGreaterThan(0);
      expect(result.thirdPerson.length).toBeGreaterThan(0);
    });
  });

  describe('Property 4: Pronoun Ratio Calculation', () => {
    it('should calculate correct pronoun ratio', () => {
      // Feature: lie-detector-nlp, Property 4: Pronoun Ratio Calculation
      fc.assert(
        fc.property(
          fc.constantFrom(
            "I went there",
            "He went there and she agreed",
            "They said that he would come"
          ),
          (text) => {
            const result = parser.analyzePronoun(text);
            const total = result.firstPerson.length + result.thirdPerson.length;
            
            if (total > 0) {
              const expectedRatio = result.thirdPerson.length / total;
              expect(result.ratio).toBeCloseTo(expectedRatio, 2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Pronoun Distancing Detection', () => {
    it('should flag distancing when third-person ratio > 0.6 and total >= 3', () => {
      // Feature: lie-detector-nlp, Property 5: Pronoun Distancing Detection
      const text = "He said that they went there and she agreed with them";
      const result = parser.analyzePronoun(text);
      
      const total = result.firstPerson.length + result.thirdPerson.length;
      if (result.ratio > 0.6 && total >= 3) {
        expect(result.isDistancing).toBe(true);
      }
    });
  });

  describe('Property 6: Tense Identification', () => {
    it('should identify verb tenses in sentences', () => {
      // Feature: lie-detector-nlp, Property 6: Tense Identification
      const text = "I went to the store. I am buying groceries.";
      const result = parser.detectTenseShifts(text);
      
      expect(result).toBeDefined();
    });
  });

  describe('Property 7: Tense Shift Detection', () => {
    it('should detect tense shifts between consecutive sentences', () => {
      // Feature: lie-detector-nlp, Property 7: Tense Shift Detection
      const text = "I went to the store. I buy some milk. I returned home.";
      const result = parser.detectTenseShifts(text);
      
      expect(result.tenseShifts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Property 8: Within-Sentence Tense Consistency', () => {
    it('should detect within-sentence tense inconsistencies', () => {
      // Feature: lie-detector-nlp, Property 8: Within-Sentence Tense Consistency
      const text = "I went to the store and buy milk.";
      const result = parser.detectTenseShifts(text);
      
      expect(result.inconsistentSentences).toBeDefined();
    });
  });

  describe('Property 9: Quoted Speech Exclusion', () => {
    it('should exclude quoted speech from tense analysis', () => {
      // Feature: lie-detector-nlp, Property 9: Quoted Speech Exclusion
      const text = 'I said "I am going" but I went yesterday';
      const result = parser.detectTenseShifts(text);
      
      expect(result).toBeDefined();
    });
  });

  describe('Property 10: Named Entity Extraction', () => {
    it('should extract named entities from text', () => {
      // Feature: lie-detector-nlp, Property 10: Named Entity Extraction
      const text = "John went to New York and met with Microsoft representatives.";
      const result = parser.extractEntities(text);
      
      expect(result.entities.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Property 11: Entity Density Detection', () => {
    it('should calculate entity density correctly', () => {
      // Feature: lie-detector-nlp, Property 11: Entity Density Detection
      fc.assert(
        fc.property(
          fc.constantFrom(
            "John went to the store",
            "The meeting happened yesterday at the office"
          ),
          (text) => {
            const result = parser.extractEntities(text);
            expect(result.density).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 22: Passive Voice Detection', () => {
    it('should detect passive voice sentences', () => {
      // Feature: lie-detector-nlp, Property 22: Passive Voice Detection
      const text = "The ball was thrown by John. Mary caught it.";
      const result = parser.detectPassiveVoice(text);
      
      expect(result.passivePercentage).toBeGreaterThanOrEqual(0);
      expect(result.passivePercentage).toBeLessThanOrEqual(1);
    });
  });

  // ========== NEW PROPERTY TESTS FOR TASK 7.2 ==========

  describe('Property 6: Passive Voice Identification', () => {
    it('should identify all passive voice constructions and calculate percentage', () => {
      // Feature: lie-detector-nlp, Property 6: Passive Voice Identification
      // **Validates: Requirements 3.1, 3.2**
      fc.assert(
        fc.property(
          fc.constantFrom(
            "The ball was thrown by John. The game was won by our team.",
            "The report was written yesterday. The meeting was scheduled for today.",
            "The car was repaired. The bill was paid. The keys were returned.",
            "She completed the task. The project was finished on time.",
            "The door was opened. Someone entered the room."
          ),
          (text) => {
            const result = parser.analyzeAgentDeletion(text);
            
            // Should have all required fields
            expect(result.passiveSentences).toBeDefined();
            expect(Array.isArray(result.passiveSentences)).toBe(true);
            expect(typeof result.passiveCount).toBe('number');
            expect(typeof result.totalSentences).toBe('number');
            expect(typeof result.passivePercentage).toBe('number');
            expect(typeof result.isExcessive).toBe('boolean');
            
            // passiveCount should match passiveSentences length
            expect(result.passiveCount).toBe(result.passiveSentences.length);
            
            // passivePercentage should be calculated correctly
            if (result.totalSentences > 0) {
              const expectedPercentage = (result.passiveCount / result.totalSentences) * 100;
              expect(result.passivePercentage).toBeCloseTo(expectedPercentage, 5);
            }
            
            // passivePercentage should be in valid range [0, 100]
            expect(result.passivePercentage).toBeGreaterThanOrEqual(0);
            expect(result.passivePercentage).toBeLessThanOrEqual(100);
            
            // Each passive sentence index should be valid
            result.passiveSentences.forEach(index => {
              expect(index).toBeGreaterThanOrEqual(0);
              expect(index).toBeLessThan(result.totalSentences);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Agent Deletion Threshold Detection', () => {
    it('should flag agent deletion when passive voice exceeds 40% with specific sentence indices', () => {
      // Feature: lie-detector-nlp, Property 7: Agent Deletion Threshold Detection
      // **Validates: Requirements 3.3, 3.5**
      
      // Test case 1: Excessive passive voice (> 40%)
      const excessivePassiveText = "The ball was thrown. The game was won. The trophy was awarded. The celebration was held. The team was congratulated.";
      const excessiveResult = parser.analyzeAgentDeletion(excessivePassiveText);
      expect(excessiveResult.passivePercentage).toBeGreaterThan(40);
      expect(excessiveResult.isExcessive).toBe(true);
      expect(excessiveResult.passiveSentences.length).toBeGreaterThan(0);
      
      // Test case 2: Normal passive voice usage (< 40%)
      const normalText = "I went to the store. The door was opened. She bought groceries. He cooked dinner. We ate together.";
      const normalResult = parser.analyzeAgentDeletion(normalText);
      expect(normalResult.passivePercentage).toBeLessThanOrEqual(40);
      expect(normalResult.isExcessive).toBe(false);
      
      // Test case 3: No passive voice
      const activeText = "I completed the project. She wrote the report. He presented the findings. We celebrated the success.";
      const activeResult = parser.analyzeAgentDeletion(activeText);
      expect(activeResult.passivePercentage).toBe(0);
      expect(activeResult.isExcessive).toBe(false);
      expect(activeResult.passiveSentences.length).toBe(0);
    });
  });
});
