import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ReportGenerator } from '../src/components/ReportGenerator';
import { 
  AnalysisReport, 
  IndicatorDetail,
  SentenceFlag,
  NarrativeStructureInfo,
  NarrativeStructureAnalysis
} from '../src/models';
import { DeceptionIndicator, TextLocation, IndicatorType } from '../src/models/DeceptionIndicator';

describe('API Format Property Tests', () => {
  const reportGenerator = new ReportGenerator();

  // Arbitraries for generating test data
  const severityArb = fc.constantFrom('low' as const, 'medium' as const, 'high' as const);
  const verdictArb = fc.constantFrom('likely_truthful' as const, 'uncertain' as const, 'likely_lie' as const);
  
  const indicatorTypeArb = fc.constantFrom(
    'tense_inconsistency' as IndicatorType,
    'agent_deletion' as IndicatorType,
    'pronoun_inconsistency' as IndicatorType,
    'low_lexical_diversity' as IndicatorType,
    'negation_clustering' as IndicatorType,
    'incomplete_narrative' as IndicatorType,
    'information_density_mismatch' as IndicatorType,
    'cognitive_load_language' as IndicatorType
  );

  const textLocationArb: fc.Arbitrary<TextLocation> = fc.record({
    sentenceIndex: fc.nat(20),
    startChar: fc.nat(1000),
    endChar: fc.nat(1000),
    text: fc.string({ minLength: 5, maxLength: 100 })
  });

  const deceptionIndicatorArb: fc.Arbitrary<DeceptionIndicator> = fc.record({
    id: fc.uuid(),
    type: indicatorTypeArb,
    severity: severityArb,
    location: textLocationArb,
    description: fc.string({ minLength: 10, maxLength: 200 }),
    evidence: fc.string({ minLength: 5, maxLength: 100 }),
    weight: fc.double({ min: 0.1, max: 0.25, noNaN: true })
  });

  const narrativeStructureArb: fc.Arbitrary<NarrativeStructureAnalysis> = fc.record({
    hasPrologue: fc.boolean(),
    hasCoreEvent: fc.constant(true),
    hasEpilogue: fc.boolean(),
    missing: fc.array(fc.constantFrom('prologue', 'epilogue'), { maxLength: 2 }),
    prologueRange: fc.option(fc.record({ start: fc.nat(10), end: fc.nat(10) }), { nil: undefined }),
    coreEventRange: fc.option(fc.record({ start: fc.nat(10), end: fc.nat(10) }), { nil: undefined }),
    epilogueRange: fc.option(fc.record({ start: fc.nat(10), end: fc.nat(10) }), { nil: undefined }),
    isComplete: fc.boolean()
  });

  /**
   * Property 32: Complete Analysis Report Structure
   * 
   * For all valid report inputs, the generated AnalysisReport must contain
   * all required fields with correct types.
   */
  it('Property 32: Complete Analysis Report Structure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 10000 }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.double({ min: 5, max: 20, noNaN: true }),
        verdictArb,
        fc.array(deceptionIndicatorArb, { maxLength: 10 }),
        narrativeStructureArb,
        (text, score, confidenceInterval, verdict, indicators, narrativeStructure) => {
          const report = reportGenerator.generateReport({
            text,
            score,
            confidenceInterval,
            verdict,
            indicators,
            narrativeStructure
          });

          // Verify all required fields exist
          expect(report).toHaveProperty('score');
          expect(report).toHaveProperty('confidence_interval');
          expect(report).toHaveProperty('verdict');
          expect(report).toHaveProperty('indicators');
          expect(report).toHaveProperty('sentence_flags');
          expect(report).toHaveProperty('narrative_structure');
          expect(report).toHaveProperty('summary');

          // Verify field types
          expect(typeof report.score).toBe('number');
          expect(typeof report.confidence_interval).toBe('number');
          expect(typeof report.verdict).toBe('string');
          expect(Array.isArray(report.indicators)).toBe(true);
          expect(Array.isArray(report.sentence_flags)).toBe(true);
          expect(typeof report.narrative_structure).toBe('object');
          expect(typeof report.summary).toBe('string');

          // Verify score range
          expect(report.score).toBeGreaterThanOrEqual(0);
          expect(report.score).toBeLessThanOrEqual(100);

          // Verify verdict values
          expect(['likely_truthful', 'uncertain', 'likely_lie']).toContain(report.verdict);

          // Verify indicators structure
          report.indicators.forEach((ind: IndicatorDetail) => {
            expect(ind).toHaveProperty('name');
            expect(ind).toHaveProperty('severity');
            expect(ind).toHaveProperty('weight');
            expect(ind).toHaveProperty('contribution');
            expect(ind).toHaveProperty('detail');
            expect(['low', 'medium', 'high']).toContain(ind.severity);
            expect(typeof ind.weight).toBe('number');
            expect(typeof ind.contribution).toBe('number');
          });

          // Verify sentence_flags structure
          report.sentence_flags.forEach((flag: SentenceFlag) => {
            expect(flag).toHaveProperty('sentence');
            expect(flag).toHaveProperty('index');
            expect(flag).toHaveProperty('flags');
            expect(flag).toHaveProperty('severity');
            expect(typeof flag.index).toBe('number');
            expect(Array.isArray(flag.flags)).toBe(true);
            expect(['low', 'medium', 'high']).toContain(flag.severity);
          });

          // Verify narrative_structure
          expect(report.narrative_structure).toHaveProperty('has_prologue');
          expect(report.narrative_structure).toHaveProperty('has_epilogue');
          expect(report.narrative_structure).toHaveProperty('missing');
          expect(typeof report.narrative_structure.has_prologue).toBe('boolean');
          expect(typeof report.narrative_structure.has_epilogue).toBe('boolean');
          expect(Array.isArray(report.narrative_structure.missing)).toBe(true);

          // Verify summary is 2-3 sentences (rough check)
          const sentenceCount = report.summary.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
          expect(sentenceCount).toBeGreaterThanOrEqual(1);
          expect(sentenceCount).toBeLessThanOrEqual(4);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 33: JSON Output Validation
   * 
   * For all valid AnalysisReports, the JSON output must be valid JSON
   * and contain no syntax errors.
   */
  it('Property 33: JSON Output Validation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 10000 }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.double({ min: 5, max: 20, noNaN: true }),
        verdictArb,
        fc.array(deceptionIndicatorArb, { maxLength: 10 }),
        narrativeStructureArb,
        (text, score, confidenceInterval, verdict, indicators, narrativeStructure) => {
          const report = reportGenerator.generateReport({
            text,
            score,
            confidenceInterval,
            verdict,
            indicators,
            narrativeStructure
          });

          const jsonOutput = reportGenerator.toJSON(report);

          // Verify it's valid JSON
          expect(() => JSON.parse(jsonOutput)).not.toThrow();

          // Verify parsed object has correct structure
          const parsed = JSON.parse(jsonOutput);
          expect(parsed).toHaveProperty('score');
          expect(parsed).toHaveProperty('confidence_interval');
          expect(parsed).toHaveProperty('verdict');
          expect(parsed).toHaveProperty('indicators');
          expect(parsed).toHaveProperty('sentence_flags');
          expect(parsed).toHaveProperty('narrative_structure');
          expect(parsed).toHaveProperty('summary');

          // Verify no undefined or null in required fields
          expect(parsed.score).not.toBeUndefined();
          expect(parsed.confidence_interval).not.toBeUndefined();
          expect(parsed.verdict).not.toBeUndefined();
          expect(parsed.summary).not.toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 34: JSON Serialization Round-Trip
   * 
   * For all valid AnalysisReports, serializing to JSON and deserializing
   * must produce an equivalent object (round-trip property).
   */
  it('Property 34: JSON Serialization Round-Trip', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 10000 }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.double({ min: 5, max: 20, noNaN: true }),
        verdictArb,
        fc.array(deceptionIndicatorArb, { maxLength: 10 }),
        narrativeStructureArb,
        (text, score, confidenceInterval, verdict, indicators, narrativeStructure) => {
          const originalReport = reportGenerator.generateReport({
            text,
            score,
            confidenceInterval,
            verdict,
            indicators,
            narrativeStructure
          });

          // Serialize to JSON
          const jsonOutput = reportGenerator.toJSON(originalReport);

          // Deserialize back to object
          const deserializedReport = reportGenerator.fromJSON(jsonOutput);

          // Verify round-trip equivalence
          expect(deserializedReport.score).toBe(originalReport.score);
          expect(deserializedReport.confidence_interval).toBe(originalReport.confidence_interval);
          expect(deserializedReport.verdict).toBe(originalReport.verdict);
          expect(deserializedReport.summary).toBe(originalReport.summary);
          
          // Verify arrays have same length
          expect(deserializedReport.indicators.length).toBe(originalReport.indicators.length);
          expect(deserializedReport.sentence_flags.length).toBe(originalReport.sentence_flags.length);
          
          // Verify narrative structure
          expect(deserializedReport.narrative_structure.has_prologue).toBe(originalReport.narrative_structure.has_prologue);
          expect(deserializedReport.narrative_structure.has_epilogue).toBe(originalReport.narrative_structure.has_epilogue);
          expect(deserializedReport.narrative_structure.missing.length).toBe(originalReport.narrative_structure.missing.length);

          // Verify indicators content
          deserializedReport.indicators.forEach((ind, idx) => {
            expect(ind.name).toBe(originalReport.indicators[idx].name);
            expect(ind.severity).toBe(originalReport.indicators[idx].severity);
            expect(ind.weight).toBe(originalReport.indicators[idx].weight);
            expect(ind.contribution).toBe(originalReport.indicators[idx].contribution);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
