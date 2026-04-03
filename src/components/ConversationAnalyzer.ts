import nlp from 'compromise';
import { Analyzer } from './Analyzer';
import {
  ConversationAnalysis,
  MessageAnalysis,
  CrossMessagePattern,
  AnalyzerInput
} from '../models';

export class ConversationAnalyzer {
  private analyzer: Analyzer;

  constructor() {
    this.analyzer = new Analyzer();
  }

  async analyzeConversation(text: string): Promise<ConversationAnalysis> {
    // Parse messages from conversation export
    const messages = this.parseMessages(text);

    // Analyze each message individually using all 9 analysis layers
    const messageAnalyses: MessageAnalysis[] = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const input: AnalyzerInput = {
        text: message,
        mode: 'single'
      };

      const result = await this.analyzer.analyze(input);

      if (result.success && result.data) {
        messageAnalyses.push({
          messageIndex: i,
          text: message,
          report: result.data
        });
      }
    }

    // Calculate aggregate confidence score with recency-weighted messages
    const aggregateScore = this.calculateAggregateScore(messageAnalyses);
    
    // Boost score based on cross-message patterns
    const crossMessagePatterns = this.detectCrossMessagePatterns(messageAnalyses);
    const patternBoost = Math.min(35, crossMessagePatterns.length * 16); // 16 points per pattern, max 35
    const finalAggregateScore = Math.min(100, Math.round((aggregateScore + patternBoost) * 10) / 10);
    
    const aggregateLevel = this.getConfidenceLevel(finalAggregateScore);

    // Generate conversation-level summary
    const summary = this.generateConversationSummary(
      aggregateLevel,
      messageAnalyses.length,
      crossMessagePatterns
    );

    return {
      messages: messageAnalyses,
      aggregateScore: finalAggregateScore,
      aggregateLevel,
      crossMessagePatterns,
      summary
    };
  }

  parseMessages(text: string): string[] {
    // Split by line breaks or timestamps
    // Support multiple formats:
    // 1. Timestamps: /\d{1,2}:\d{2}\s*(am|pm)?/gi
    // 2. Bracketed timestamps: /\[\d{1,2}:\d{2}\s*(AM|PM)\]/gi
    // 3. Double line breaks: /\n\n+/
    
    // Trim input first
    const trimmedText = text.trim();
    if (trimmedText.length < 10) {
      return [text]; // Return original if too short
    }
    
    // First, try to split by double line breaks
    let messages: string[] = [];
    const doubleLineBreakSplit = trimmedText.split(/\n\n+/);
    
    if (doubleLineBreakSplit.length > 1) {
      // Use double line break splitting
      messages = doubleLineBreakSplit
        .map(msg => msg.trim())
        .filter(msg => msg.length >= 10);
    } else {
      // Try timestamp-based splitting (including WhatsApp format)
      const timestampRegex = /(\[\d{1,2}:\d{2}\s*(AM|PM)\]|\d{1,2}:\d{2}\s*(AM|PM)|\d{1,2}:\d{2}\s*(am|pm))/gi;
      const lines = trimmedText.split(/\n/);
      let currentMessage = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) continue;
        
        // Check if line starts with timestamp
        const hasTimestamp = timestampRegex.test(trimmed);
        timestampRegex.lastIndex = 0; // Reset regex
        
        if (hasTimestamp && currentMessage.length >= 10) {
          // Save previous message and start new one
          messages.push(currentMessage.trim());
          currentMessage = trimmed.replace(/^(\[\d{1,2}:\d{2}\s*(AM|PM)\]|\d{1,2}:\d{2}\s*(AM|PM)|\d{1,2}:\d{2}\s*(am|pm))\s*/i, '');
        } else {
          // Append to current message
          currentMessage += (currentMessage ? ' ' : '') + trimmed;
        }
      }
      
      // Add final message
      if (currentMessage.length >= 10) {
        messages.push(currentMessage.trim());
      }
    }
    
    // If no valid splitting found, treat entire text as single message
    return messages.length > 0 ? messages : [trimmedText];
  }

  private calculateAggregateScore(messages: MessageAnalysis[]): number {
    if (messages.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    messages.forEach((msg, index) => {
      // Recency weighting: weight[i] = 1 + (i / messageCount) * 0.5
      // Recent messages get higher weight than earlier messages
      const weight = 1 + (index / messages.length) * 0.5;
      weightedSum += msg.report.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
  }

  private getConfidenceLevel(score: number): 'Low' | 'Medium' | 'High' {
    if (score >= 67) {
      return 'High';
    } else if (score >= 34) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  private detectCrossMessagePatterns(messages: MessageAnalysis[]): CrossMessagePattern[] {
    const patterns: CrossMessagePattern[] = [];

    if (messages.length < 2) return patterns;

    // Extract key facts from each message using compromise
    const messageEntities = messages.map(msg => this.extractEntities(msg.text));

    // Detect story inconsistencies - entities that appear, disappear, then reappear
    const entityMap = new Map<string, Set<number>>();

    messageEntities.forEach((entities, msgIndex) => {
      entities.forEach(entity => {
        const normalized = entity.toLowerCase();
        if (!entityMap.has(normalized)) {
          entityMap.set(normalized, new Set());
        }
        entityMap.get(normalized)!.add(msgIndex);
      });
    });

    // Check for entities that appear and disappear (potential inconsistency)
    entityMap.forEach((messageIndices, entity) => {
      if (messageIndices.size >= 2) {
        const indices = Array.from(messageIndices).sort((a, b) => a - b);
        const firstAppearance = indices[0];
        const lastAppearance = indices[indices.length - 1];

        // Check if entity is missing in middle messages
        for (let i = firstAppearance + 1; i < lastAppearance; i++) {
          if (!messageIndices.has(i)) {
            patterns.push({
              type: 'story_inconsistency',
              involvedMessages: [firstAppearance, i, lastAppearance],
              description: `Entity "${entity}" mentioned in messages ${firstAppearance} and ${lastAppearance} but not in message ${i}`
            });
            break;
          }
        }
      }
    });

    // Detect timeline mismatches by checking tense consistency
    const tensePatterns = messages.map(msg => this.detectDominantTense(msg.text));
    for (let i = 0; i < tensePatterns.length - 1; i++) {
      if (tensePatterns[i] !== tensePatterns[i + 1] && 
          tensePatterns[i] !== 'mixed' && 
          tensePatterns[i + 1] !== 'mixed') {
        patterns.push({
          type: 'timeline_mismatch',
          involvedMessages: [i, i + 1],
          description: `Timeline inconsistency: message ${i} uses ${tensePatterns[i]} tense, message ${i + 1} uses ${tensePatterns[i + 1]} tense`
        });
      }
    }

    // Detect detail contradictions by comparing specific facts
    for (let i = 0; i < messages.length - 1; i++) {
      for (let j = i + 1; j < messages.length; j++) {
        const contradictions = this.findDetailContradictions(
          messages[i].text,
          messages[j].text,
          messageEntities[i],
          messageEntities[j]
        );
        
        contradictions.forEach(contradiction => {
          patterns.push({
            type: 'detail_contradiction',
            involvedMessages: [i, j],
            description: contradiction
          });
        });
      }
    }

    return patterns;
  }

  private extractEntities(text: string): string[] {
    const doc = nlp(text);
    const entities: string[] = [];

    // Extract people names
    const people = doc.people().out('array');
    entities.push(...people);

    // Extract places
    const places = doc.places().out('array');
    entities.push(...places);

    // Extract organizations
    const orgs = doc.organizations().out('array');
    entities.push(...orgs);

    return entities;
  }

  /**
   * Extract temporal references from text with sentence indices
   * Returns array of {value: string, sentenceIndex: number} objects
   * Used for timeline mismatch detection (Requirement 14.5)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private extractTemporalReferences(text: string): Array<{value: string; sentenceIndex: number}> {
    const doc = nlp(text);
    const temporal: Array<{value: string; sentenceIndex: number}> = [];
    const sentences = doc.sentences().out('array');

    // Process each sentence
    sentences.forEach((sentence: string, sentenceIndex: number) => {
      const sentenceDoc = nlp(sentence);
      
      // Extract dates using compromise's date matching
      const dateMatches = sentenceDoc.match('#Date').out('array');
      dateMatches.forEach((date: string) => {
        temporal.push({ value: date, sentenceIndex });
      });

      // Extract time patterns: "at 3pm", "3:00", "noon", etc.
      const timePattern = /\b(?:at\s+)?(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|noon|midnight)\b/gi;
      const timeMatches = sentence.match(timePattern) || [];
      timeMatches.forEach((time: string) => {
        temporal.push({ value: time.trim(), sentenceIndex });
      });

      // Extract day references: "on Monday", "yesterday", "today", "tomorrow"
      const dayPattern = /\b(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|yesterday|today|tomorrow|last\s+\w+|next\s+\w+)\b/gi;
      const dayMatches = sentence.match(dayPattern) || [];
      dayMatches.forEach((day: string) => {
        temporal.push({ value: day.trim(), sentenceIndex });
      });

      // Extract relative time: "before", "after", "earlier", "later"
      const relativePattern = /\b(before|after|earlier|later|previously|subsequently|then)\b/gi;
      const relativeMatches = sentence.match(relativePattern) || [];
      relativeMatches.forEach((rel: string) => {
        temporal.push({ value: rel.trim(), sentenceIndex });
      });
    });

    return temporal;
  }

  private findDetailContradictions(
    text1: string,
    text2: string,
    entities1: string[],
    entities2: string[]
  ): string[] {
    const contradictions: string[] = [];

    // Check for same entity with different attributes
    const commonEntities = entities1.filter(e1 => 
      entities2.some(e2 => e1.toLowerCase() === e2.toLowerCase())
    );

    // Simple contradiction detection: look for negation patterns
    commonEntities.forEach(entity => {
      const doc1 = nlp(text1);
      const doc2 = nlp(text2);

      const sentences1 = doc1.sentences().out('array');
      const sentences2 = doc2.sentences().out('array');

      sentences1.forEach((s1: string) => {
        if (s1.toLowerCase().includes(entity.toLowerCase())) {
          sentences2.forEach((s2: string) => {
            if (s2.toLowerCase().includes(entity.toLowerCase())) {
              // Check for contradictory statements (basic heuristic)
              const hasNegation1 = /\b(not|no|never|didn't|don't|doesn't)\b/i.test(s1);
              const hasNegation2 = /\b(not|no|never|didn't|don't|doesn't)\b/i.test(s2);
              
              if (hasNegation1 !== hasNegation2) {
                contradictions.push(
                  `Potential contradiction about "${entity}": one statement is negated, the other is not`
                );
              }
            }
          });
        }
      });
    });

    return contradictions;
  }

  private detectDominantTense(text: string): 'past' | 'present' | 'future' | 'mixed' {
    const pastIndicators = ['was', 'were', 'had', 'did', 'went', 'said', 'told'];
    const presentIndicators = ['is', 'are', 'am', 'do', 'does', 'go', 'say', 'tell'];
    const futureIndicators = ['will', 'shall', 'going to'];

    const lowerText = text.toLowerCase();
    let pastCount = 0;
    let presentCount = 0;
    let futureCount = 0;

    pastIndicators.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) pastCount += matches.length;
    });

    presentIndicators.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) presentCount += matches.length;
    });

    futureIndicators.forEach(phrase => {
      const regex = new RegExp(phrase, 'g');
      const matches = lowerText.match(regex);
      if (matches) futureCount += matches.length;
    });

    const total = pastCount + presentCount + futureCount;
    if (total === 0) return 'present';

    const maxCount = Math.max(pastCount, presentCount, futureCount);
    const dominanceThreshold = 0.5;

    if (maxCount / total < dominanceThreshold) return 'mixed';

    if (pastCount === maxCount) return 'past';
    if (futureCount === maxCount) return 'future';
    return 'present';
  }

  private generateConversationSummary(
    level: 'Low' | 'Medium' | 'High',
    messageCount: number,
    crossMessagePatterns: CrossMessagePattern[]
  ): string {
    let summary = `Analyzed ${messageCount} message${messageCount > 1 ? 's' : ''}. `;

    switch (level) {
      case 'High':
        summary += `High likelihood of deception across the conversation.`;
        break;
      case 'Medium':
        summary += `Moderate signs of deception detected.`;
        break;
      case 'Low':
        summary += `Minimal signs of deception detected.`;
        break;
    }

    if (crossMessagePatterns.length > 0) {
      summary += ` ${crossMessagePatterns.length} cross-message inconsistenc${crossMessagePatterns.length > 1 ? 'ies' : 'y'} found`;
      
      // Summarize pattern types
      const storyInconsistencies = crossMessagePatterns.filter(p => p.type === 'story_inconsistency').length;
      const timelineMismatches = crossMessagePatterns.filter(p => p.type === 'timeline_mismatch').length;
      const detailContradictions = crossMessagePatterns.filter(p => p.type === 'detail_contradiction').length;
      
      const patternTypes: string[] = [];
      if (storyInconsistencies > 0) patternTypes.push(`${storyInconsistencies} story inconsistenc${storyInconsistencies > 1 ? 'ies' : 'y'}`);
      if (timelineMismatches > 0) patternTypes.push(`${timelineMismatches} timeline mismatch${timelineMismatches > 1 ? 'es' : ''}`);
      if (detailContradictions > 0) patternTypes.push(`${detailContradictions} detail contradiction${detailContradictions > 1 ? 's' : ''}`);
      
      if (patternTypes.length > 0) {
        summary += ` (${patternTypes.join(', ')})`;
      }
      summary += '.';
    }

    return summary;
  }
}
