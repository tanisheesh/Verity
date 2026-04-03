import nlp from 'compromise';
import {
  PronounAnalysis,
  TenseAnalysis,
  TenseShift,
  EntityAnalysis,
  NamedEntity,
  EntityInconsistency,
  PassiveVoiceAnalysis,
  TenseConsistencyAnalysis,
  VerbPhrase,
  PronounConsistencyAnalysis,
  PronounOccurrence,
  PronounShift,
  AgentDeletionAnalysis
} from '../models';

export class SyntaxParser {
  private readonly firstPersonPronouns = ['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours'];
  private readonly firstPersonSingular = ['i', 'me', 'my', 'mine'];
  private readonly thirdPersonPronouns = ['he', 'she', 'they', 'them', 'their', 'his', 'her', 'theirs'];

  analyzePronoun(text: string): PronounAnalysis {
    const doc = nlp(text);
    const pronouns = doc.pronouns().out('array').map((p: string) => p.toLowerCase());

    const firstPerson = pronouns.filter((p: string) => this.firstPersonPronouns.includes(p));
    const thirdPerson = pronouns.filter((p: string) => this.thirdPersonPronouns.includes(p));

    const totalPronouns = firstPerson.length + thirdPerson.length;
    const ratio = totalPronouns > 0 ? thirdPerson.length / totalPronouns : 0;
    const isDistancing = ratio > 0.6 && totalPronouns >= 3;

    return {
      firstPerson,
      thirdPerson,
      ratio,
      isDistancing
    };
  }

  detectTenseShifts(text: string): TenseAnalysis {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const tenseShifts: TenseShift[] = [];
    const inconsistentSentences: number[] = [];

    const sentenceTenses: string[] = [];

    sentences.forEach((sentence: string, index: number) => {
      // Skip quoted speech
      if (sentence.includes('"') || sentence.includes("'")) {
        const withoutQuotes = sentence.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '');
        const sentenceDoc = nlp(withoutQuotes);
        const tense = this.determineTense(sentenceDoc);
        sentenceTenses.push(tense);
      } else {
        const sentenceDoc = nlp(sentence);
        const tense = this.determineTense(sentenceDoc);
        sentenceTenses.push(tense);

        // Check within-sentence tense consistency
        const verbs = sentenceDoc.verbs().out('array');
        if (verbs.length > 1) {
          const verbTenses = verbs.map((v: string) => this.determineTense(nlp(v)));
          const hasPast = verbTenses.includes('past');
          const hasPresent = verbTenses.includes('present');
          if (hasPast && hasPresent) {
            inconsistentSentences.push(index);
          }
        }
      }
    });

    // Detect shifts between consecutive sentences
    for (let i = 0; i < sentenceTenses.length - 1; i++) {
      const fromTense = sentenceTenses[i];
      const toTense = sentenceTenses[i + 1];

      if ((fromTense === 'past' && toTense === 'present') ||
          (fromTense === 'present' && toTense === 'past')) {
        tenseShifts.push({
          fromSentence: i,
          toSentence: i + 1,
          fromTense,
          toTense,
          isJustified: false
        });
      }
    }

    return {
      tenseShifts,
      inconsistentSentences
    };
  }

  private determineTense(doc: any): string {
    const pastVerbs = doc.verbs().toPastTense().out('array');
    const originalVerbs = doc.verbs().out('array');

    let pastCount = 0;
    let presentCount = 0;
    let futureCount = 0;

    originalVerbs.forEach((verb: string) => {
      if (pastVerbs.includes(verb) || verb.endsWith('ed')) {
        pastCount++;
      } else if (verb.includes('will') || verb.includes('going to')) {
        futureCount++;
      } else {
        presentCount++;
      }
    });

    if (futureCount > 0) return 'future';
    if (pastCount > presentCount) return 'past';
    return 'present';
  }

  extractEntities(text: string): EntityAnalysis {
    const doc = nlp(text);
    const wordCount = doc.terms().out('array').length;

    const people = doc.people().out('array');
    const places = doc.places().out('array');
    const organizations = doc.organizations().out('array');

    const entityMap = new Map<string, NamedEntity>();

    people.forEach((person: string) => {
      const normalized = person.toLowerCase();
      if (entityMap.has(normalized)) {
        entityMap.get(normalized)!.frequency++;
      } else {
        entityMap.set(normalized, { text: person, type: 'person', frequency: 1 });
      }
    });

    places.forEach((place: string) => {
      const normalized = place.toLowerCase();
      if (entityMap.has(normalized)) {
        entityMap.get(normalized)!.frequency++;
      } else {
        entityMap.set(normalized, { text: place, type: 'place', frequency: 1 });
      }
    });

    organizations.forEach((org: string) => {
      const normalized = org.toLowerCase();
      if (entityMap.has(normalized)) {
        entityMap.get(normalized)!.frequency++;
      } else {
        entityMap.set(normalized, { text: org, type: 'organization', frequency: 1 });
      }
    });

    const entities = Array.from(entityMap.values());
    const density = wordCount > 0 ? (entities.length / (wordCount / 50)) : 0;

    // Detect inconsistent references (simplified)
    const inconsistentReferences: EntityInconsistency[] = [];

    return {
      entities,
      density,
      inconsistentReferences
    };
  }

  detectPassiveVoice(text: string): PassiveVoiceAnalysis {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const passiveSentences: number[] = [];

    sentences.forEach((sentence: string, index: number) => {
      const sentenceDoc = nlp(sentence);
      
      // Check for passive voice indicators
      const hasBeVerb = sentenceDoc.match('(is|are|was|were|been|being) #Verb').found;
      const hasByPhrase = sentence.toLowerCase().includes(' by ');
      
      if (hasBeVerb || hasByPhrase) {
        passiveSentences.push(index);
      }
    });

    const passivePercentage = sentences.length > 0 
      ? passiveSentences.length / sentences.length 
      : 0;

    return {
      passiveSentences,
      passivePercentage
    };
  }

  analyzeTenseConsistency(text: string): TenseConsistencyAnalysis {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const verbPhrases: VerbPhrase[] = [];
    const tenseShifts: TenseShift[] = [];
    const inconsistentSentences: number[] = [];

    // Extract verb phrases and their tenses from each sentence
    sentences.forEach((sentence: string, index: number) => {
      // Check if sentence contains quoted speech
      const isQuoted = sentence.includes('"') || sentence.includes("'");
      
      // If quoted, remove quotes for analysis but mark verbs as quoted
      let sentenceToAnalyze = sentence;
      if (isQuoted) {
        sentenceToAnalyze = sentence.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '');
      }

      const sentenceDoc = nlp(sentenceToAnalyze);
      const verbs = sentenceDoc.verbs();

      // Extract each verb and its tense
      verbs.forEach((verb: any) => {
        const verbText = verb.text();
        
        // Handle empty/null returns gracefully
        if (!verbText || verbText.trim().length === 0) {
          return;
        }

        // Determine tense using compromise methods
        let tense: 'past' | 'present' | 'future' = 'present';
        
        // Check for past tense
        if (verb.has('#PastTense') || verb.has('#Past')) {
          tense = 'past';
        }
        // Check for future tense
        else if (verb.has('#Future') || verbText.toLowerCase().includes('will')) {
          tense = 'future';
        }
        // Check for present tense (default)
        else if (verb.has('#PresentTense') || verb.has('#Present')) {
          tense = 'present';
        }
        // Fallback: try to detect tense from verb form
        else {
          const pastForm = verb.toPastTense().text();
          const presentForm = verb.toPresentTense().text();
          
          if (verbText === pastForm && verbText !== presentForm) {
            tense = 'past';
          } else {
            tense = 'present';
          }
        }

        verbPhrases.push({
          text: verbText,
          tense,
          sentenceIndex: index,
          isQuoted
        });
      });
    });

    // Build tense sequence excluding quoted verbs
    const nonQuotedVerbs = verbPhrases.filter(v => !v.isQuoted);
    
    // Group verbs by sentence to get dominant tense per sentence
    const sentenceTenses: Map<number, string> = new Map();
    nonQuotedVerbs.forEach(verb => {
      if (!sentenceTenses.has(verb.sentenceIndex)) {
        sentenceTenses.set(verb.sentenceIndex, verb.tense);
      }
    });

    // Detect unexplained shifts between consecutive sentences
    const sentenceIndices = Array.from(sentenceTenses.keys()).sort((a, b) => a - b);
    for (let i = 0; i < sentenceIndices.length - 1; i++) {
      const currentIdx = sentenceIndices[i];
      const nextIdx = sentenceIndices[i + 1];
      const fromTense = sentenceTenses.get(currentIdx)!;
      const toTense = sentenceTenses.get(nextIdx)!;

      // Detect shifts between past/present/future
      if (fromTense !== toTense) {
        // Check if shift is justified (for now, all shifts are considered unexplained)
        const isJustified = false;

        tenseShifts.push({
          fromSentence: currentIdx,
          toSentence: nextIdx,
          fromTense,
          toTense,
          isJustified
        });

        if (!isJustified) {
          inconsistentSentences.push(nextIdx);
        }
      }
    }

    const shiftCount = tenseShifts.filter(shift => !shift.isJustified).length;

    return {
      verbPhrases,
      tenseShifts,
      shiftCount,
      inconsistentSentences
    };
  }

  analyzePronounConsistency(text: string): PronounConsistencyAnalysis {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const firstPersonPronouns: PronounOccurrence[] = [];
    const shifts: PronounShift[] = [];

    // Extract pronouns from each sentence
    sentences.forEach((sentence: string, index: number) => {
      const sentenceDoc = nlp(sentence);
      const pronouns = sentenceDoc.pronouns();

      // Handle empty/null returns from .pronouns() gracefully
      if (!pronouns || pronouns.length === 0) {
        return;
      }

      const pronounArray = pronouns.out('array');
      
      // Filter for first-person pronouns
      pronounArray.forEach((pronoun: string) => {
        const lowerPronoun = pronoun.toLowerCase();
        if (this.firstPersonPronouns.includes(lowerPronoun)) {
          // Classify as singular or plural
          const type: 'singular' | 'plural' = this.firstPersonSingular.includes(lowerPronoun) 
            ? 'singular' 
            : 'plural';

          firstPersonPronouns.push({
            pronoun: lowerPronoun,
            sentenceIndex: index,
            type
          });
        }
      });
    });

    const pronounCount = firstPersonPronouns.length;

    // If total pronouns < 3: mark as inconclusive, return early
    if (pronounCount < 3) {
      return {
        firstPersonPronouns,
        pronounCount,
        hasShifts: false,
        shifts: [],
        isInconclusive: true
      };
    }

    // Detect shifts from singular to plural or vice versa
    // Group pronouns by sentence
    const sentencePronouns: Map<number, 'singular' | 'plural' | 'mixed'> = new Map();
    firstPersonPronouns.forEach(p => {
      const existing = sentencePronouns.get(p.sentenceIndex);
      if (!existing) {
        sentencePronouns.set(p.sentenceIndex, p.type);
      } else if (existing !== p.type) {
        sentencePronouns.set(p.sentenceIndex, 'mixed');
      }
    });

    // Check for shifts between consecutive sentences
    const sentenceIndices = Array.from(sentencePronouns.keys()).sort((a, b) => a - b);
    for (let i = 0; i < sentenceIndices.length - 1; i++) {
      const currentIdx = sentenceIndices[i];
      const nextIdx = sentenceIndices[i + 1];
      const fromType = sentencePronouns.get(currentIdx)!;
      const toType = sentencePronouns.get(nextIdx)!;

      // Skip if either sentence has mixed pronouns
      if (fromType === 'mixed' || toType === 'mixed') {
        continue;
      }

      // Detect shift
      if (fromType !== toType) {
        shifts.push({
          fromSentence: currentIdx,
          toSentence: nextIdx,
          fromType,
          toType
        });
      }
    }

    const hasShifts = shifts.length > 0;

    return {
      firstPersonPronouns,
      pronounCount,
      hasShifts,
      shifts,
      isInconclusive: false
    };
  }

  /**
   * Layer 2: Analyze agent deletion through passive voice detection
   * Identifies excessive passive voice usage to avoid responsibility
   */
  analyzeAgentDeletion(text: string): AgentDeletionAnalysis {
    // Split text into sentences using compromise
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const totalSentences = sentences.length;
    const passiveSentences: number[] = [];

    // For each sentence: parse and check for passive voice
    sentences.forEach((sentence: string, index: number) => {
      const sentenceDoc = nlp(sentence);
      
      // Handle empty/null returns gracefully
      if (!sentenceDoc || !sentence || sentence.trim().length === 0) {
        return; // Skip this sentence
      }

      try {
        // Check for passive voice using compromise's passive voice detection
        // Method 1: Check for "be + past participle" pattern
        const hasPassivePattern = sentenceDoc.match('(is|are|was|were|been|being) #Verb').found;
        
        // Method 2: Check for explicit passive voice match
        const verbs = sentenceDoc.verbs();
        let hasPassive = false;
        
        if (verbs && verbs.length > 0) {
          // Try to detect passive voice through verb analysis
          // compromise doesn't have a direct isPassive() method, so we use pattern matching
          hasPassive = hasPassivePattern;
        }

        // Handle null/undefined returns gracefully
        if (hasPassive === null || hasPassive === undefined) {
          return; // Skip this sentence if result is inconclusive
        }

        if (hasPassive) {
          passiveSentences.push(index);
        }
      } catch (error) {
        // If analysis throws an error, skip this sentence gracefully
        return;
      }
    });

    // Calculate metrics
    const passiveCount = passiveSentences.length;
    const passivePercentage = totalSentences > 0 ? (passiveCount / totalSentences) * 100 : 0;

    // Check threshold: flag if passivePercentage > 40
    const isExcessive = passivePercentage > 40;

    return {
      passiveSentences,
      passiveCount,
      totalSentences,
      passivePercentage,
      isExcessive
    };
  }

  /**
   * Helper method to parse text with compromise
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private parseDoc(text: string): any {
    return nlp(text);
  }

  /**
   * Analyze tense consistency from pre-parsed doc (performance optimization)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  analyzeTenseConsistencyFromDoc(doc: any, text: string): TenseConsistencyAnalysis {
    const sentences = doc.sentences().out('array');
    const verbPhrases: VerbPhrase[] = [];
    const tenseShifts: TenseShift[] = [];
    const inconsistentSentences: number[] = [];

    // Extract verb phrases and their tenses from each sentence
    sentences.forEach((sentence: string, index: number) => {
      // Check if sentence contains quoted speech
      const isQuoted = sentence.includes('"') || sentence.includes("'");
      
      // If quoted, remove quotes for analysis but mark verbs as quoted
      let sentenceToAnalyze = sentence;
      if (isQuoted) {
        sentenceToAnalyze = sentence.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '');
      }

      const sentenceDoc = nlp(sentenceToAnalyze);
      const verbs = sentenceDoc.verbs();

      // Extract each verb and its tense
      verbs.forEach((verb: any) => {
        const verbText = verb.text();
        
        // Handle empty/null returns gracefully
        if (!verbText || verbText.trim().length === 0) {
          return;
        }

        // Determine tense using compromise methods
        let tense: 'past' | 'present' | 'future' = 'present';
        
        // Check for past tense
        if (verb.has('#PastTense') || verb.has('#Past')) {
          tense = 'past';
        }
        // Check for future tense
        else if (verb.has('#Future') || verbText.toLowerCase().includes('will')) {
          tense = 'future';
        }
        // Check for present tense (default)
        else if (verb.has('#PresentTense') || verb.has('#Present')) {
          tense = 'present';
        }
        // Fallback: try to detect tense from verb form
        else {
          const pastForm = verb.toPastTense().text();
          const presentForm = verb.toPresentTense().text();
          
          if (verbText === pastForm && verbText !== presentForm) {
            tense = 'past';
          } else {
            tense = 'present';
          }
        }

        verbPhrases.push({
          text: verbText,
          tense,
          sentenceIndex: index,
          isQuoted
        });
      });
    });

    // Build tense sequence excluding quoted verbs
    const nonQuotedVerbs = verbPhrases.filter(v => !v.isQuoted);
    
    // Group verbs by sentence to get dominant tense per sentence
    const sentenceTenses: Map<number, string> = new Map();
    nonQuotedVerbs.forEach(verb => {
      if (!sentenceTenses.has(verb.sentenceIndex)) {
        sentenceTenses.set(verb.sentenceIndex, verb.tense);
      }
    });

    // Detect unexplained shifts between consecutive sentences
    const sentenceIndices = Array.from(sentenceTenses.keys()).sort((a, b) => a - b);
    for (let i = 0; i < sentenceIndices.length - 1; i++) {
      const currentIdx = sentenceIndices[i];
      const nextIdx = sentenceIndices[i + 1];
      const fromTense = sentenceTenses.get(currentIdx)!;
      const toTense = sentenceTenses.get(nextIdx)!;

      // Detect shifts between past/present/future
      if (fromTense !== toTense) {
        // Check if shift is justified (for now, all shifts are considered unexplained)
        const isJustified = false;

        tenseShifts.push({
          fromSentence: currentIdx,
          toSentence: nextIdx,
          fromTense,
          toTense,
          isJustified
        });

        if (!isJustified) {
          inconsistentSentences.push(nextIdx);
        }
      }
    }

    const shiftCount = tenseShifts.filter(shift => !shift.isJustified).length;

    return {
      verbPhrases,
      tenseShifts,
      shiftCount,
      inconsistentSentences
    };
  }

  /**
   * Analyze agent deletion from pre-parsed doc (performance optimization)
   */
  analyzeAgentDeletionFromDoc(doc: any): AgentDeletionAnalysis {
    const sentences = doc.sentences().out('array');
    const passiveSentences: number[] = [];

    sentences.forEach((sentence: string, index: number) => {
      const sentenceDoc = nlp(sentence);
      
      // Detect passive voice using compromise
      const hasPassive = sentenceDoc.match('(is|are|was|were|been|being) #Verb').found;
      const hasByPhrase = sentence.toLowerCase().includes(' by ');
      
      if (hasPassive || hasByPhrase) {
        passiveSentences.push(index);
      }
    });

    // Calculate metrics
    const totalSentences = sentences.length;
    const passiveCount = passiveSentences.length;
    const passivePercentage = totalSentences > 0 ? (passiveCount / totalSentences) * 100 : 0;

    // Check threshold: flag if passivePercentage > 40
    const isExcessive = passivePercentage > 40;

    return {
      passiveSentences,
      passiveCount,
      totalSentences,
      passivePercentage,
      isExcessive
    };
  }

  /**
   * Analyze pronoun consistency from pre-parsed doc (performance optimization)
   */
  analyzePronounConsistencyFromDoc(doc: any): PronounConsistencyAnalysis {
    const sentences = doc.sentences().out('array');
    const pronounOccurrences: PronounOccurrence[] = [];
    const pronounShifts: PronounShift[] = [];

    // Extract pronouns from each sentence
    sentences.forEach((sentence: string, index: number) => {
      const sentenceDoc = nlp(sentence);
      const pronouns = sentenceDoc.pronouns().out('array').map((p: string) => p.toLowerCase());

      pronouns.forEach((pronoun: string) => {
        let category: 'first_person_singular' | 'first_person_plural' | 'third_person' | 'other' = 'other';

        if (this.firstPersonSingular.includes(pronoun)) {
          category = 'first_person_singular';
        } else if (['we', 'us', 'our', 'ours'].includes(pronoun)) {
          category = 'first_person_plural';
        } else if (this.thirdPersonPronouns.includes(pronoun)) {
          category = 'third_person';
        }

        pronounOccurrences.push({
          pronoun,
          category,
          sentenceIndex: index,
          type: category.includes('singular') ? 'singular' : 'plural'
        });
      });
    });

    // Detect shifts between pronoun categories across sentences
    const sentenceCategories: Map<number, string> = new Map();
    pronounOccurrences.forEach(occ => {
      if (!sentenceCategories.has(occ.sentenceIndex) && occ.category) {
        sentenceCategories.set(occ.sentenceIndex, occ.category);
      }
    });

    const sentenceIndices = Array.from(sentenceCategories.keys()).sort((a, b) => a - b);
    for (let i = 0; i < sentenceIndices.length - 1; i++) {
      const currentIdx = sentenceIndices[i];
      const nextIdx = sentenceIndices[i + 1];
      const fromCategory = sentenceCategories.get(currentIdx)!;
      const toCategory = sentenceCategories.get(nextIdx)!;

      if (fromCategory !== toCategory && fromCategory !== 'other' && toCategory !== 'other') {
        pronounShifts.push({
          fromSentence: currentIdx,
          toSentence: nextIdx,
          fromType: fromCategory,
          toType: toCategory,
          fromCategory: fromCategory as any,
          toCategory: toCategory as any
        });
      }
    }

    const hasShifts = pronounShifts.length > 0;
    const isInconclusive = pronounOccurrences.length < 3;

    return {
      firstPersonPronouns: pronounOccurrences,
      pronounCount: pronounOccurrences.length,
      hasShifts,
      shifts: pronounShifts,
      isInconclusive,
      pronounOccurrences,
      pronounShifts
    };
  }
}
