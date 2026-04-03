import natural from 'natural';
import nlp from 'compromise';
import {
  SentimentAnalysis,
  SentenceSentiment,
  SentimentShift,
  ContextMismatch
} from '../models';

export class SentimentAnalyzer {
  private analyzer: any;
  private tokenizer: any;

  constructor() {
    this.analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
  }

  analyze(text: string): SentimentAnalysis {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');

    const sentenceScores: SentenceSentiment[] = [];

    sentences.forEach((sentence: string, index: number) => {
      const tokens = this.tokenizer.tokenize(sentence);
      const polarity = tokens && tokens.length > 0 
        ? this.analyzer.getSentiment(tokens) 
        : 0;

      sentenceScores.push({
        sentenceIndex: index,
        text: sentence,
        polarity
      });
    });

    const overallPolarity = sentenceScores.length > 0
      ? sentenceScores.reduce((sum, s) => sum + s.polarity, 0) / sentenceScores.length
      : 0;

    const shifts = this.detectShifts(sentenceScores);
    const contextMismatches = this.detectContextMismatches(sentenceScores);

    return {
      overallPolarity,
      sentenceScores,
      shifts,
      contextMismatches
    };
  }

  detectShifts(scores: SentenceSentiment[]): SentimentShift[] {
    const shifts: SentimentShift[] = [];

    for (let i = 0; i < scores.length - 1; i++) {
      const magnitude = Math.abs(scores[i + 1].polarity - scores[i].polarity);
      
      if (magnitude > 1.0) {
        shifts.push({
          fromSentence: i,
          toSentence: i + 1,
          magnitude
        });
      }
    }

    return shifts;
  }

  private detectContextMismatches(scores: SentenceSentiment[]): ContextMismatch[] {
    const mismatches: ContextMismatch[] = [];

    const positiveKeywords = ['happy', 'great', 'wonderful', 'excellent', 'success', 'win', 'celebrate'];
    const negativeKeywords = ['sad', 'terrible', 'awful', 'fail', 'loss', 'death', 'accident'];

    scores.forEach((score) => {
      const lowerText = score.text.toLowerCase();

      const hasPositiveContext = positiveKeywords.some(keyword => lowerText.includes(keyword));
      const hasNegativeContext = negativeKeywords.some(keyword => lowerText.includes(keyword));

      if (hasPositiveContext && score.polarity < -0.3) {
        mismatches.push({
          sentenceIndex: score.sentenceIndex,
          expectedSentiment: 'positive',
          actualPolarity: score.polarity,
          reason: 'Positive event described with negative sentiment'
        });
      }

      if (hasNegativeContext && score.polarity > 0.3) {
        mismatches.push({
          sentenceIndex: score.sentenceIndex,
          expectedSentiment: 'negative',
          actualPolarity: score.polarity,
          reason: 'Negative event described with positive sentiment'
        });
      }
    });

    return mismatches;
  }
}
