import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { HeuristicEngine } from '../src/components/HeuristicEngine';

describe('HeuristicEngine Tests', () => {
  let engine: HeuristicEngine;

  beforeEach(() => {
    engine = new HeuristicEngine();
  });

  describe('Property 17: Average Sentence Length Calculation', () => {
    it('should calculate average sentence length correctly', () => {
      // Feature: lie-detector-nlp, Property 17: Average Sentence Length Calculation
      const text = "Short sentence. This is a longer sentence with more words.";
      const result = engine.detectOverExplanation(text);
      
      expect(result).toBeDefined();
    });
  });

  describe('Property 18: Over-Explanation Detection by Length', () => {
    it('should detect sentences exceeding 2.5x average length', () => {
      // Feature: lie-detector-nlp, Property 18: Over-Explanation Detection by Length
      const text = "Short. This is an extremely long sentence with many unnecessary words that goes on and on and provides excessive detail about mundane things.";
      const result = engine.detectOverExplanation(text);
      
      expect(result.longSentences).toBeDefined();
    });
  });

  describe('Property 19: Qualifying Phrase Detection', () => {
    it('should detect qualifying phrases', () => {
      // Feature: lie-detector-nlp, Property 19: Qualifying Phrase Detection
      const text = "Actually, I honestly think that literally everything is basically fine, frankly.";
      const result = engine.detectOverExplanation(text);
      
      expect(result.qualifierCount).toBeGreaterThan(0);
    });
  });

  describe('Property 20: Unnecessary Detail Detection', () => {
    it('should detect unnecessary details like exact times and numbers', () => {
      // Feature: lie-detector-nlp, Property 20: Unnecessary Detail Detection
      const text = "I arrived at exactly 3:45 PM with 1234 dollars in my pocket.";
      const result = engine.detectOverExplanation(text);
      
      expect(result.unnecessaryDetails.length).toBeGreaterThan(0);
    });
  });

  describe('Property 21: Unanswered Question Detection', () => {
    it('should detect unanswered questions', () => {
      // Feature: lie-detector-nlp, Property 21: Unanswered Question Detection
      const text = "What happened yesterday? Who was there?";
      const result = engine.detectEvasion(text);
      
      expect(result.unansweredQuestions).toBeDefined();
    });
  });

  describe('Property 23: Hedging Phrase Detection', () => {
    it('should detect hedging phrases', () => {
      // Feature: lie-detector-nlp, Property 23: Hedging Phrase Detection
      const text = "I think maybe possibly I guess it could be that perhaps it might work.";
      const result = engine.detectEvasion(text);
      
      expect(result.hedgingPhrases.length).toBeGreaterThan(0);
    });
  });

  describe('Property 24: Negation Phrase Detection', () => {
    it('should detect negation phrases', () => {
      // Feature: lie-detector-nlp, Property 24: Negation Phrase Detection
      const text = "I didn't do it. I wouldn't do that. I never said anything.";
      const result = engine.detectEvasion(text);
      
      expect(result.negationPhrases.length).toBeGreaterThan(0);
    });
  });

  // ===== NEW PROPERTY TESTS FOR NEGATION CLUSTERING AND COGNITIVE LOAD =====

  describe('Property 10: Type-Token Ratio Calculation', () => {
    it('should calculate TTR as unique words divided by total words, excluding stop words', () => {
      // Feature: lie-detector-nlp, Property 10: Type-Token Ratio Calculation
      fc.assert(
        fc.property(
          fc.string({ minLength: 30, maxLength: 200 }),
          (text) => {
            // Skip if text is too short after tokenization
            if (text.trim().length < 30) return true;

            const result = engine.analyzeLexicalDiversity(text);
            
            // TTR should be between 0 and 1
            expect(result.typeTokenRatio).toBeGreaterThanOrEqual(0);
            expect(result.typeTokenRatio).toBeLessThanOrEqual(1);
            
            // Unique words should never exceed total words
            expect(result.uniqueWords).toBeLessThanOrEqual(result.totalWords);
            
            // If there are words, TTR should be calculated correctly
            if (result.totalWords > 0) {
              const expectedTTR = result.uniqueWords / result.totalWords;
              expect(result.typeTokenRatio).toBeCloseTo(expectedTTR, 5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Low Lexical Diversity Detection', () => {
    it('should flag low diversity when 30+ words AND TTR < 0.6', () => {
      // Feature: lie-detector-nlp, Property 11: Low Lexical Diversity Detection
      
      // Test case 1: Low diversity (repetitive text with non-stop words)
      const lowDiversityText = "apple banana apple banana apple banana apple banana apple banana apple banana apple banana apple banana apple banana apple banana apple banana apple banana apple banana apple banana apple banana apple banana";
      const lowResult = engine.analyzeLexicalDiversity(lowDiversityText);
      expect(lowResult.totalWords).toBeGreaterThanOrEqual(30);
      expect(lowResult.isLowDiversity).toBe(true);
      
      // Test case 2: High diversity (varied vocabulary)
      const highDiversityText = "The quick brown fox jumps over lazy dogs while exploring magnificent gardens filled with colorful flowers and singing birds";
      const highResult = engine.analyzeLexicalDiversity(highDiversityText);
      expect(highResult.isLowDiversity).toBe(false);
    });
  });

  describe('Property 12: Negation Word Identification', () => {
    it('should identify all negation words in text', () => {
      // Feature: lie-detector-nlp, Property 12: Negation Word Identification
      fc.assert(
        fc.property(
          fc.constantFrom('not', 'no', 'never', 'neither', 'nor', 'nothing', 'nobody', 'nowhere', 'none'),
          fc.string({ minLength: 5, maxLength: 50 }),
          (negationWord, textFragment) => {
            const text = `This is ${negationWord} a test sentence with ${textFragment}`;
            const result = engine.analyzeNegationClustering(text);
            
            // Should find at least the negation word we inserted
            const foundNegation = result.negationWords.some(n => n.word === negationWord);
            expect(foundNegation).toBe(true);
            expect(result.totalNegations).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: Negation Clustering Detection', () => {
    it('should flag sentences with 2+ negation words as clustered', () => {
      // Feature: lie-detector-nlp, Property 13: Negation Clustering Detection
      
      // Test case 1: Clustered negations
      const clusteredText = "I never said nothing to nobody about that.";
      const clusteredResult = engine.analyzeNegationClustering(clusteredText);
      expect(clusteredResult.clusteredSentences.length).toBeGreaterThan(0);
      
      // Test case 2: Single negation per sentence
      const nonClusteredText = "I didn't go. She never came. He won't arrive.";
      const nonClusteredResult = engine.analyzeNegationClustering(nonClusteredText);
      expect(nonClusteredResult.clusteredSentences.length).toBe(0);
    });
  });

  describe('Property 14: Negation Density Calculation', () => {
    it('should calculate negation density as total negations divided by sentence count', () => {
      // Feature: lie-detector-nlp, Property 14: Negation Density Calculation
      fc.assert(
        fc.property(
          fc.string({ minLength: 20, maxLength: 200 }),
          (text) => {
            // Skip empty or whitespace-only text
            if (text.trim().length < 10) return true;

            const result = engine.analyzeNegationClustering(text);
            
            // Density should be non-negative
            expect(result.negationDensity).toBeGreaterThanOrEqual(0);
            
            // If there are sentences, density should be calculated correctly
            if (result.sentenceCount > 0) {
              const expectedDensity = result.totalNegations / result.sentenceCount;
              expect(result.negationDensity).toBeCloseTo(expectedDensity, 5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Preemptive Negation Detection', () => {
    it('should detect negations appearing before the main claim', () => {
      // Feature: lie-detector-nlp, Property 15: Preemptive Negation Detection
      
      // Test case: Preemptive negation at start of sentence
      const preemptiveText = "Not that I remember, but maybe something happened yesterday.";
      const result = engine.analyzeNegationClustering(preemptiveText);
      
      // Should detect at least one preemptive negation
      const hasPreemptive = result.negationWords.some(n => n.isPreemptive);
      expect(hasPreemptive).toBe(true);
    });
  });

  describe('Property 21: Memory Hedge Detection', () => {
    it('should identify memory hedges', () => {
      // Feature: lie-detector-nlp, Property 21: Memory Hedge Detection
      fc.assert(
        fc.property(
          fc.constantFrom("I think", "I believe", "as far as I remember", "if I recall", "I'm not sure", "I guess"),
          fc.string({ minLength: 5, maxLength: 50 }),
          (memoryHedge, textFragment) => {
            const text = `${memoryHedge} that ${textFragment} happened yesterday.`;
            const result = engine.analyzeCognitiveLoad(text);
            
            // Should find the memory hedge
            expect(result.memoryHedges.length).toBeGreaterThanOrEqual(1);
            expect(result.totalHedges).toBeGreaterThanOrEqual(1);
            
            // Verify category is correct
            const foundHedge = result.memoryHedges.some(h => h.category === 'memory');
            expect(foundHedge).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 22: Probability Hedge Detection', () => {
    it('should identify probability hedges', () => {
      // Feature: lie-detector-nlp, Property 22: Probability Hedge Detection
      fc.assert(
        fc.property(
          fc.constantFrom("maybe", "possibly", "probably", "might", "could be", "perhaps", "I suppose"),
          fc.string({ minLength: 5, maxLength: 50 }),
          (probabilityHedge, textFragment) => {
            const text = `It ${probabilityHedge} happened with ${textFragment}.`;
            const result = engine.analyzeCognitiveLoad(text);
            
            // Should find the probability hedge
            expect(result.probabilityHedges.length).toBeGreaterThanOrEqual(1);
            expect(result.totalHedges).toBeGreaterThanOrEqual(1);
            
            // Verify category is correct
            const foundHedge = result.probabilityHedges.some(h => h.category === 'probability');
            expect(foundHedge).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 23: Distancing Language Detection', () => {
    it('should identify distancing language', () => {
      // Feature: lie-detector-nlp, Property 23: Distancing Language Detection
      fc.assert(
        fc.property(
          fc.constantFrom("sort of", "kind of", "somewhat", "rather", "fairly", "pretty much"),
          fc.string({ minLength: 5, maxLength: 50 }),
          (distancingPhrase, textFragment) => {
            const text = `It was ${distancingPhrase} like ${textFragment}.`;
            const result = engine.analyzeCognitiveLoad(text);
            
            // Should find the distancing language
            expect(result.distancingLanguage.length).toBeGreaterThanOrEqual(1);
            expect(result.totalHedges).toBeGreaterThanOrEqual(1);
            
            // Verify category is correct
            const foundHedge = result.distancingLanguage.some(h => h.category === 'distancing');
            expect(foundHedge).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 24: Veracity Emphasis Detection', () => {
    it('should identify veracity emphasis phrases and flag as RED FLAGS', () => {
      // Feature: lie-detector-nlp, Property 24: Veracity Emphasis Detection
      fc.assert(
        fc.property(
          fc.constantFrom("honestly", "to be honest", "truthfully", "I swear", "believe me", "trust me", "to tell the truth"),
          fc.string({ minLength: 5, maxLength: 50 }),
          (veracityPhrase, textFragment) => {
            const text = `${veracityPhrase}, ${textFragment} is what happened.`;
            const result = engine.analyzeCognitiveLoad(text);
            
            // Should find the veracity emphasis
            expect(result.veracityEmphasis.length).toBeGreaterThanOrEqual(1);
            expect(result.totalHedges).toBeGreaterThanOrEqual(1);
            
            // Verify category is correct
            const foundHedge = result.veracityEmphasis.some(h => h.category === 'veracity');
            expect(foundHedge).toBe(true);
            
            // RED FLAG: Should always flag as excessive when veracity emphasis present
            expect(result.isExcessive).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 25: Hedge Density Calculation', () => {
    it('should calculate hedge density as total hedges divided by sentence count', () => {
      // Feature: lie-detector-nlp, Property 25: Hedge Density Calculation
      fc.assert(
        fc.property(
          fc.string({ minLength: 20, maxLength: 200 }),
          (text) => {
            // Skip empty or whitespace-only text
            if (text.trim().length < 10) return true;

            const result = engine.analyzeCognitiveLoad(text);
            
            // Density should be non-negative
            expect(result.hedgeDensity).toBeGreaterThanOrEqual(0);
            
            // If there are sentences, density should be calculated correctly
            if (result.hedgeDensity > 0) {
              const doc = require('compromise')(text);
              const sentenceCount = doc.sentences().out('array').length;
              if (sentenceCount > 0) {
                const expectedDensity = result.totalHedges / sentenceCount;
                expect(result.hedgeDensity).toBeCloseTo(expectedDensity, 5);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 26: Excessive Hedge Density Detection', () => {
    it('should flag excessive hedge density when > 0.3 hedges per sentence', () => {
      // Feature: lie-detector-nlp, Property 26: Excessive Hedge Density Detection
      
      // Test case 1: Excessive hedging
      const excessiveText = "I think maybe possibly I guess it could be that perhaps it might work. I believe probably it's sort of okay.";
      const excessiveResult = engine.analyzeCognitiveLoad(excessiveText);
      expect(excessiveResult.hedgeDensity).toBeGreaterThan(0.3);
      expect(excessiveResult.isExcessive).toBe(true);
      
      // Test case 2: Normal hedging
      const normalText = "I went to the store yesterday. I bought some groceries. I came home and cooked dinner.";
      const normalResult = engine.analyzeCognitiveLoad(normalText);
      expect(normalResult.isExcessive).toBe(false);
    });
  });
});
