/**
 * Known Test Samples for End-to-End Testing
 * 
 * This file contains carefully crafted test samples with known deception indicators
 * and truthful samples for validation of the 9-layer analysis system.
 */

export interface KnownSample {
  id: string;
  text: string;
  expectedVerdict: 'likely_truthful' | 'uncertain' | 'likely_lie';
  expectedMinScore?: number;
  expectedMaxScore?: number;
  expectedIndicators: string[];
  description: string;
  testedLayers: string[];
}

/**
 * DECEPTIVE SAMPLES
 * These samples contain multiple deception indicators and should score >= 67
 */
export const deceptiveSamples: KnownSample[] = [
  {
    id: 'deceptive_1_tense_agent_negation',
    text: `I was at the office yesterday working on the quarterly report. The deadline was approaching very fast. 
    The document was being prepared by the team. The final draft was reviewed by management last week. 
    The revisions were made by someone. The formatting was handled by others. The data was compiled by the analysts. 
    I didn't see the final version. I wasn't involved in the approval process. I don't know who signed off on it. 
    Nobody told me about the submission. The report gets sent to headquarters now. Everything is finalized today. 
    The feedback comes back positive. Honestly, to be honest, I think it goes well.`,
    expectedVerdict: 'likely_lie',
    expectedMinScore: 45,
    expectedIndicators: [
      'tense_inconsistency',
      'agent_deletion',
      'negation_clustering',
      'incomplete_narrative',
      'cognitive_load_language'
    ],
    description: 'Tests tense shifts (past→present), excessive passive voice, and negation clustering',
    testedLayers: ['Layer 1: Tense Consistency', 'Layer 2: Agent Deletion', 'Layer 5: Negation Clustering']
  },

  {
    id: 'deceptive_2_pronoun_narrative_density',
    text: `We were planning the event for weeks. The venue was booked early. We had everything organized. 
    Then someone made the final arrangements. The catering was handled. The invitations were sent out. 
    After the event, I realized it went well. I learned a lot from the experience.`,
    expectedVerdict: 'likely_lie',
    expectedMinScore: 25,
    expectedIndicators: [
      'agent_deletion',
      'incomplete_narrative'
    ],
    description: 'Tests pronoun shift (we→someone→I), passive voice, and excessive peripheral detail',
    testedLayers: ['Layer 3: Pronoun Consistency', 'Layer 2: Agent Deletion', 'Layer 7: Information Density']
  },

  {
    id: 'deceptive_3_incomplete_narrative_hedges',
    text: `I think I went to the place yesterday. Maybe I went to the place around that time. The place was where I went to do the thing. 
    I believe the place had some things there. To be honest, the things at the place were sort of normal things I saw. 
    I guess the place was a place I went to see. Honestly, going to the place was something I did at the place that day. 
    The place had things and I think I saw the things at the place. Maybe the things were normal things. 
    I'm not sure about the things I saw. The thing I did was go to the place. I think the place was the place. 
    Maybe I believe the thing happened. To be honest, I guess it was sort of normal.`,
    expectedVerdict: 'likely_lie',
    expectedMinScore: 45,
    expectedIndicators: [
      'tense_inconsistency',
      'low_lexical_diversity',
      'incomplete_narrative',
      'cognitive_load_language'
    ],
    description: 'Tests missing prologue/epilogue, excessive hedges, veracity emphasis, and low TTR',
    testedLayers: ['Layer 6: Narrative Structure', 'Layer 8: Cognitive Load', 'Layer 4: Lexical Diversity']
  },

  {
    id: 'deceptive_4_all_layers',
    text: `Before the meeting last week, we were preparing the presentation materials. The slides were being created by the design team. 
    The data was compiled by someone in analytics. The charts were made by others in the department. 
    The research was conducted by external consultants. I didn't work on the financial analysis section. 
    I wasn't responsible for the market research part. I don't know who handled the competitor analysis. 
    Nobody mentioned any issues with the data. The presentation was given by me yesterday. 
    The feedback was received positively by the executives. Honestly, it goes well today. 
    To be honest, everyone seems satisfied now. Maybe I think the results were accepted. 
    I guess it worked out fine. Possibly the outcome is positive.`,
    expectedVerdict: 'likely_lie',
    expectedMinScore: 25,
    expectedIndicators: [
      'agent_deletion',
      'incomplete_narrative',
      'cognitive_load_language'
    ],
    description: 'Tests multiple layers: tense shifts, passive voice, pronoun shifts, negations, hedges',
    testedLayers: ['Layer 1', 'Layer 2', 'Layer 3', 'Layer 5', 'Layer 8']
  },

  {
    id: 'deceptive_5_density_imbalance',
    text: `Something happened at the office. The thing occurred. Maybe I think something was done. 
    I guess it happened somehow. The thing was handled. Possibly it was resolved.`,
    expectedVerdict: 'likely_lie',
    expectedMinScore: 25,
    expectedIndicators: [
      'incomplete_narrative',
      'cognitive_load_language'
    ],
    description: 'Tests extreme information density imbalance with vague core event',
    testedLayers: ['Layer 7: Information Density', 'Layer 6: Narrative Structure']
  }
];

/**
 * TRUTHFUL SAMPLES
 * These samples have minimal deception indicators and should score <= 33
 */
export const truthfulSamples: KnownSample[] = [
  {
    id: 'truthful_1_complete_narrative',
    text: `Yesterday morning, I arrived at the office around 9am for our quarterly review meeting. 
    During the meeting, I presented the sales figures for Q3, which showed a 15% increase over Q2. 
    My manager asked several questions about the regional breakdown, and I explained the data in detail. 
    After the presentation, the team discussed next quarter's targets and agreed on new goals. 
    I felt confident about the results and left the meeting with clear action items.`,
    expectedVerdict: 'likely_truthful',
    expectedMaxScore: 33,
    expectedIndicators: [],
    description: 'Complete narrative with consistent tense, active voice, clear structure',
    testedLayers: ['All layers - baseline truthful sample']
  },

  {
    id: 'truthful_2_consistent_pronouns',
    text: `I went to the grocery store this afternoon to buy ingredients for dinner. 
    I picked up fresh vegetables, chicken breast, and pasta. I spent about thirty minutes 
    comparing prices and selecting the best produce. I paid at the checkout and drove home. 
    I prepared a simple pasta dish with grilled chicken and roasted vegetables for my family.`,
    expectedVerdict: 'likely_truthful',
    expectedMaxScore: 33,
    expectedIndicators: [],
    description: 'Consistent first-person pronouns, active voice, good lexical diversity',
    testedLayers: ['Layer 3: Pronoun Consistency', 'Layer 4: Lexical Diversity']
  },

  {
    id: 'truthful_3_balanced_detail',
    text: `Before the conference, I reviewed my presentation notes and practiced my delivery. 
    During my talk, I explained our new product features to an audience of about fifty people. 
    I demonstrated the user interface, answered questions about pricing and availability, 
    and discussed our roadmap for future updates. After the session, several attendees 
    approached me with follow-up questions, and I exchanged contact information with potential clients.`,
    expectedVerdict: 'likely_truthful',
    expectedMaxScore: 33,
    expectedIndicators: [],
    description: 'Balanced information density across prologue, core event, and epilogue',
    testedLayers: ['Layer 6: Narrative Structure', 'Layer 7: Information Density']
  },

  {
    id: 'truthful_4_active_voice',
    text: `I called the customer service department to resolve a billing issue. 
    The representative answered promptly and asked for my account number. 
    I provided the information and explained the discrepancy I noticed on my statement. 
    She reviewed my account, identified the error, and processed a refund immediately. 
    I thanked her for the quick resolution and ended the call satisfied with the outcome.`,
    expectedVerdict: 'likely_truthful',
    expectedMaxScore: 33,
    expectedIndicators: [],
    description: 'Predominantly active voice, clear agent identification throughout',
    testedLayers: ['Layer 2: Agent Deletion', 'Layer 3: Pronoun Consistency']
  },

  {
    id: 'truthful_5_rich_vocabulary',
    text: `I attended a fascinating workshop on sustainable architecture yesterday. 
    The instructor demonstrated innovative techniques for reducing energy consumption in buildings. 
    We examined case studies of successful green construction projects from various countries. 
    I participated in group discussions about implementing these strategies in urban environments. 
    The experience broadened my understanding of environmental design principles and inspired 
    new ideas for my upcoming projects.`,
    expectedVerdict: 'likely_truthful',
    expectedMaxScore: 33,
    expectedIndicators: [],
    description: 'High lexical diversity, varied vocabulary, no repetitive patterns',
    testedLayers: ['Layer 4: Lexical Diversity', 'Layer 1: Tense Consistency']
  }
];

/**
 * EDGE CASE SAMPLES
 * These samples test boundary conditions and specific scenarios
 */
export const edgeCaseSamples: KnownSample[] = [
  {
    id: 'edge_minimal_text',
    text: 'I went to the store.',
    expectedVerdict: 'likely_truthful',
    expectedMaxScore: 33,
    expectedIndicators: [],
    description: 'Minimal valid text (just above 10 character minimum)',
    testedLayers: ['Input validation', 'Graceful handling of short text']
  },

  {
    id: 'edge_quoted_speech',
    text: `I was at the meeting yesterday. John said "I am going to finish the report today." 
    I told him that was fine. He replied "I will send it by 5pm." The meeting continued 
    and we discussed other topics. Everything was resolved by the end.`,
    expectedVerdict: 'likely_truthful',
    expectedMaxScore: 33,
    expectedIndicators: [],
    description: 'Tests that quoted speech is excluded from tense consistency analysis',
    testedLayers: ['Layer 1: Tense Consistency - quoted speech exclusion']
  },

  {
    id: 'edge_justified_tense_shift',
    text: `Last week, I completed the project documentation. I submitted all the required files. 
    Now I am working on the next phase. Currently, I am developing the new features. 
    I will finish the implementation by next Friday.`,
    expectedVerdict: 'likely_truthful',
    expectedMaxScore: 33,
    expectedIndicators: [],
    description: 'Tests justified tense shifts with temporal markers (last week, now, next Friday)',
    testedLayers: ['Layer 1: Tense Consistency - justified shifts']
  }
];

/**
 * Get all samples combined
 */
export const allSamples: KnownSample[] = [
  ...deceptiveSamples,
  ...truthfulSamples,
  ...edgeCaseSamples
];

/**
 * Helper function to get sample by ID
 */
export function getSampleById(id: string): KnownSample | undefined {
  return allSamples.find(sample => sample.id === id);
}

/**
 * Helper function to get samples by verdict
 */
export function getSamplesByVerdict(verdict: 'likely_truthful' | 'uncertain' | 'likely_lie'): KnownSample[] {
  return allSamples.filter(sample => sample.expectedVerdict === verdict);
}
