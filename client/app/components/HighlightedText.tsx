'use client';

import { SentenceFlag } from '../types';

interface HighlightedTextProps {
  text: string;
  flags: SentenceFlag[];
}

export default function HighlightedText({ text, flags }: HighlightedTextProps) {
  // Split text into sentences (simple split by period, exclamation, question mark)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  const getSeverityStyle = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return { background: '#ff3b3b10', borderLeft: '3px solid var(--red)' };
      case 'medium':
        return { background: '#ff6b0010', borderLeft: '3px solid #ff6b00' };
      case 'low':
        return { background: '#ffaa0010', borderLeft: '3px solid var(--amber)' };
      default:
        return {};
    }
  };

  const getFlagForSentence = (index: number): SentenceFlag | undefined => {
    return flags.find(flag => flag.index === index);
  };

  return (
    <div
      className="p-4 rounded text-[14px] leading-[1.9]"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
    >
      {sentences.map((sentence, index) => {
        const flag = getFlagForSentence(index);
        
        if (flag) {
          return (
            <span
              key={index}
              className="inline-block px-2 py-1 rounded-r my-1 cursor-help transition-opacity hover:opacity-80"
              style={getSeverityStyle(flag.severity)}
              title={`Indicators: ${flag.flags.join(', ')}`}
            >
              {sentence.trim()}{' '}
            </span>
          );
        }
        
        return (
          <span key={index}>
            {sentence.trim()}{' '}
          </span>
        );
      })}
    </div>
  );
}
