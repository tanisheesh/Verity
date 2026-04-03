import nlp from 'compromise';
import * as natural from 'natural';
import {
  HeuristicAnalysis,
  OverExplanationIndicators,
  EvasionIndicators,
  DetailMatch,
  PhraseMatch,
  NegationClusteringAnalysis,
  NegationOccurrence,
  CognitiveLoadAnalysis,
  HedgeOccurrence,
  LexicalDiversityAnalysis
} from '../models';

export class HeuristicEngine {
  private readonly qualifyingPhrases = [
    'actually', 'honestly', 'to be honest', 'literally', 
    'basically', 'frankly', 'truthfully', 'really'
  ];

  private readonly hedgingPhrases = [
    'i think', 'maybe', 'possibly', 'i guess', 'perhaps', 
    'might', 'could be', 'probably', 'sort of', 'kind of'
  ];

  private readonly negationPhrases = [
    "i didn't", "i wouldn't", "i never", "i haven't", 
    "i can't", 'not', "wasn't", "weren't", "don't"
  ];

  detectOverExplanation(text: string): OverExplanationIndicators {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const words = doc.terms().out('array');

    // Calculate average sentence length
    const totalWords = words.length;
    const averageLength = sentences.length > 0 ? totalWords / sentences.length : 0;

    // Detect long sentences
    const longSentences: number[] = [];
    sentences.forEach((sentence: string, index: number) => {
      const sentenceDoc = nlp(sentence);
      const sentenceWords = sentenceDoc.terms().out('array').length;
      
      if (sentenceWords > 2.5 * averageLength) {
        longSentences.push(index);
      }
    });

    // Count qualifying phrases
    const lowerText = text.toLowerCase();
    let qualifierCount = 0;
    this.qualifyingPhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        qualifierCount += matches.length;
      }
    });

    // Detect unnecessary details
    const unnecessaryDetails: DetailMatch[] = [];

    // Exact times
    const timeRegex = /\d{1,2}:\d{2}\s*(am|pm)?/gi;
    let match;
    while ((match = timeRegex.exec(text)) !== null) {
      unnecessaryDetails.push({
        text: match[0],
        location: match.index,
        type: 'time'
      });
    }

    // Specific numbers (3+ digits)
    const numberRegex = /\b\d{3,}\b/g;
    while ((match = numberRegex.exec(text)) !== null) {
      unnecessaryDetails.push({
        text: match[0],
        location: match.index,
        type: 'number'
      });
    }

    return {
      longSentences,
      qualifierCount,
      unnecessaryDetails
    };
  }

  detectEvasion(text: string): EvasionIndicators {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const lowerText = text.toLowerCase();

    // Detect unanswered questions
    const unansweredQuestions: number[] = [];
    const questionWords = ['who', 'what', 'when', 'where', 'why', 'how'];

    sentences.forEach((sentence: string, index: number) => {
      const lowerSentence = sentence.toLowerCase();
      const hasQuestionWord = questionWords.some(qw => lowerSentence.includes(qw));
      
      if (hasQuestionWord) {
        // Check if answered in next 2 sentences
        let isAnswered = false;
        for (let i = index + 1; i < Math.min(index + 3, sentences.length); i++) {
          const nextSentence = sentences[i].toLowerCase();
          // Simple heuristic: if next sentences contain declarative statements
          if (nextSentence.length > 10 && !questionWords.some(qw => nextSentence.includes(qw))) {
            isAnswered = true;
            break;
          }
        }
        
        if (!isAnswered) {
          unansweredQuestions.push(index);
        }
      }
    });

    // Detect hedging phrases
    const hedgingPhrases: PhraseMatch[] = [];
    this.hedgingPhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      let match;
      while ((match = regex.exec(lowerText)) !== null) {
        // Find which sentence this belongs to
        let charCount = 0;
        let sentenceIndex = 0;
        for (let i = 0; i < sentences.length; i++) {
          if (charCount + sentences[i].length >= match.index) {
            sentenceIndex = i;
            break;
          }
          charCount += sentences[i].length + 1; // +1 for space/newline
        }

        hedgingPhrases.push({
          phrase: match[0],
          location: match.index,
          sentenceIndex
        });
      }
    });

    // Detect negation phrases
    const negationPhrases: PhraseMatch[] = [];
    this.negationPhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      let match;
      while ((match = regex.exec(lowerText)) !== null) {
        let charCount = 0;
        let sentenceIndex = 0;
        for (let i = 0; i < sentences.length; i++) {
          if (charCount + sentences[i].length >= match.index) {
            sentenceIndex = i;
            break;
          }
          charCount += sentences[i].length + 1;
        }

        negationPhrases.push({
          phrase: match[0],
          location: match.index,
          sentenceIndex
        });
      }
    });

    // Calculate passive voice usage (percentage)
    const passiveVoiceUsage = this.calculatePassiveVoicePercentage(text);

    return {
      unansweredQuestions,
      hedgingPhrases,
      negationPhrases,
      passiveVoiceUsage
    };
  }

  private calculatePassiveVoicePercentage(text: string): number {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    let passiveCount = 0;

    sentences.forEach((sentence: string) => {
      const sentenceDoc = nlp(sentence);
      const hasBeVerb = sentenceDoc.match('(is|are|was|were|been|being) #Verb').found;
      const hasByPhrase = sentence.toLowerCase().includes(' by ');
      
      if (hasBeVerb || hasByPhrase) {
        passiveCount++;
      }
    });

    return sentences.length > 0 ? passiveCount / sentences.length : 0;
  }

  analyze(text: string): HeuristicAnalysis {
    return {
      overExplanation: this.detectOverExplanation(text),
      evasionPatterns: this.detectEvasion(text)
    };
  }

  /**
   * Layer 4: Analyze lexical diversity using Type-Token Ratio (TTR)
   * Calculates the ratio of unique words to total words
   */
  analyzeLexicalDiversity(text: string): LexicalDiversityAnalysis {
    // Tokenize text using natural library
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];

    // Load stop words from natural
    const stopWords = new Set(natural.stopwords);

    // Filter tokens: remove stop words and punctuation-only tokens
    const filteredTokens = tokens.filter(token => {
      // Remove stop words
      if (stopWords.has(token)) return false;
      // Remove punctuation-only tokens
      if (/^[^\w]+$/.test(token)) return false;
      return true;
    });

    const stopWordsExcluded = tokens.length - filteredTokens.length;

    // Calculate metrics
    const totalWords = filteredTokens.length;
    const uniqueWords = new Set(filteredTokens).size;
    const typeTokenRatio = totalWords > 0 ? uniqueWords / totalWords : 0;

    // Check thresholds: flag if 30+ words AND TTR < 0.6
    const isLowDiversity = totalWords >= 30 && typeTokenRatio < 0.6;

    // DEBUG - REMOVE AFTER
    console.log('TTR - total words after stop filter:', totalWords);
    console.log('TTR - unique words:', uniqueWords);
    console.log('TTR - ratio:', typeTokenRatio);
    console.log('TTR - threshold check (>=30 words AND <0.6):', totalWords >= 30, typeTokenRatio < 0.6);

    return {
      totalWords,
      uniqueWords,
      typeTokenRatio,
      isLowDiversity,
      stopWordsExcluded
    };
  }

  /**
   * Layer 5: Analyze negation clustering patterns
   * Detects defensive or evasive language through negation word patterns
   */
  analyzeNegationClustering(text: string): NegationClusteringAnalysis {
    // Define negation patterns (regex-friendly)
    const negationPatterns = [
      /\bno\b/gi, /\bnot\b/gi, /\bnever\b/gi, /\bneither\b/gi, /\bnor\b/gi,
      /\bnothing\b/gi, /\bnobody\b/gi, /\bnowhere\b/gi, /\bnone\b/gi,
      /\bdidn't\b/gi, /\bdon't\b/gi, /\bdoesn't\b/gi, /\bwon't\b/gi,
      /\bwouldn't\b/gi, /\bcan't\b/gi, /\bcannot\b/gi, /\bcouldn't\b/gi,
      /\bshouldn't\b/gi, /\bwasn't\b/gi, /\bweren't\b/gi, /\bisn't\b/gi,
      /\baren't\b/gi, /\bhasn't\b/gi, /\bhaven't\b/gi, /\bhadn't\b/gi
    ];

    // Split text into sentences using compromise
    const doc = nlp(text);
    const sentences = doc.sentences().out('array') as string[];
    const sentenceCount = sentences.length;

    const negationWords: NegationOccurrence[] = [];
    const clusteredSentences: number[] = [];
    const preemptiveNegations: number[] = [];

    sentences.forEach((sentence, sentenceIndex) => {
      const negationsInSentence: NegationOccurrence[] = [];
      // const words = sentence.split(/\s+/);

      // Find negation words using regex patterns
      negationPatterns.forEach(pattern => {
        const matches = sentence.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Estimate position (preemptive if in first half)
            const matchIndex = sentence.toLowerCase().indexOf(match.toLowerCase());
            const isPreemptive = matchIndex < sentence.length / 2;

            const occurrence: NegationOccurrence = {
              word: match.toLowerCase(),
              sentenceIndex,
              isPreemptive
            };

            negationWords.push(occurrence);
            negationsInSentence.push(occurrence);

            if (isPreemptive) {
              preemptiveNegations.push(sentenceIndex);
            }
          });
        }
      });

      // Detect clustering: if sentence has 2+ negations
      if (negationsInSentence.length >= 2) {
        clusteredSentences.push(sentenceIndex);
      }
    });

    // Calculate negation density
    const totalNegations = negationWords.length;
    const negationDensity = sentenceCount > 0 ? totalNegations / sentenceCount : 0;

    return {
      negationWords,
      totalNegations,
      sentenceCount,
      negationDensity,
      clusteredSentences,
      preemptiveNegations
    };
  }

  /**
   * Layer 8: Analyze cognitive load language patterns
   * Detects hedge words and phrases indicating uncertainty or distancing
   */
  analyzeCognitiveLoad(text: string): CognitiveLoadAnalysis {
    // Define hedge phrase categories
    const memoryHedgesList = [
      "I think", "I believe", "as far as I remember", "if I recall", 
      "I'm not sure", "I guess"
    ];
    
    const probabilityHedgesList = [
      "maybe", "possibly", "probably", "might", "could be", 
      "perhaps", "I suppose"
    ];
    
    const distancingLanguageList = [
      "sort of", "kind of", "somewhat", "rather", "fairly", 
      "pretty much"
    ];
    
    const veracityEmphasisList = [
      "honestly", "to be honest", "truthfully", "I swear", 
      "believe me", "trust me", "to tell the truth"
    ];

    // Split text into sentences
    const doc = nlp(text);
    const sentences = doc.sentences().out('array') as string[];
    const sentenceCount = sentences.length;

    const memoryHedges: HedgeOccurrence[] = [];
    const probabilityHedges: HedgeOccurrence[] = [];
    const distancingLanguage: HedgeOccurrence[] = [];
    const veracityEmphasis: HedgeOccurrence[] = [];

    // Helper function to search for hedge phrases in sentences
    const searchHedges = (
      phraseList: string[], 
      category: 'memory' | 'probability' | 'distancing' | 'veracity',
      targetArray: HedgeOccurrence[]
    ) => {
      sentences.forEach((sentence, sentenceIndex) => {
        const lowerSentence = sentence.toLowerCase();
        
        phraseList.forEach(phrase => {
          const lowerPhrase = phrase.toLowerCase();
          if (lowerSentence.includes(lowerPhrase)) {
            targetArray.push({
              phrase,
              sentenceIndex,
              category
            });
          }
        });
      });
    };

    // Search for each hedge category
    searchHedges(memoryHedgesList, 'memory', memoryHedges);
    searchHedges(probabilityHedgesList, 'probability', probabilityHedges);
    searchHedges(distancingLanguageList, 'distancing', distancingLanguage);
    searchHedges(veracityEmphasisList, 'veracity', veracityEmphasis);

    // Calculate metrics
    const totalHedges = memoryHedges.length + probabilityHedges.length + 
                        distancingLanguage.length + veracityEmphasis.length;
    const hedgeDensity = sentenceCount > 0 ? totalHedges / sentenceCount : 0;

    // Check threshold: flag if density > 0.3 OR if any veracity emphasis present
    const isExcessive = hedgeDensity > 0.3 || veracityEmphasis.length > 0;

    return {
      memoryHedges,
      probabilityHedges,
      distancingLanguage,
      veracityEmphasis,
      totalHedges,
      hedgeDensity,
      isExcessive
    };
  }
}
