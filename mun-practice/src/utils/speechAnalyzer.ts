import { DIPLOMATIC_PHRASES } from '../data/munData';

export interface CategoryScore {
  score: number;
  max: number;
  feedback: string;
  detail?: string;
}

export interface SpeechScore {
  total: number;
  categories: {
    timing: CategoryScore;
    opening: CategoryScore;
    diplomaticLanguage: CategoryScore & { found: string[] };
    countryPosition: CategoryScore;
    structure: CategoryScore;
    evidence: CategoryScore;
    callToAction: CategoryScore;
  };
  badge: string;
  badgeColor: string;
  badgeEmoji: string;
  generalTips: string[];
  samplePhrases: string[];
}

const WORDS_PER_MINUTE = 120;

const OPENING_PHRASES = [
  'honorable chair', 'mr. chair', 'ms. chair', 'mr chair', 'ms chair',
  'respected chair', 'esteemed chair', 'distinguished delegates',
  'honorable delegates', 'fellow delegates', 'dear delegates'
];

const CLOSING_PHRASES = [
  'yields the floor', 'yields back', 'thank you', 'the delegation thanks',
  'we yield', 'my delegation yields', 'for these reasons', 'we yield the floor',
  'yield the floor'
];

const EVIDENCE_PATTERNS = [
  /\d+\s*%/,
  /\d{4}/,
  /\$[\d,.]+/,
  /\b(billion|million|trillion)\b/i,
  /according to/i,
  /studies show|research indicates|data suggests|reports confirm/i,
  /resolution\s+\d+/i,
  /article\s+\d+/i,
  /(charter|treaty|convention|protocol|accord|agreement|framework)/i,
  /(paris agreement|kyoto protocol|sdg|millennium development|agenda 2030)/i,
  /(who|unhcr|unicef|undp|wto|nato|asean|iaea|ilo|fao|unep)\b/i,
  /since \d{4}|in \d{4}|by \d{4}/i,
];

const CTA_PHRASES = [
  'calls upon', 'strongly urges', 'requests', 'demands', 'invites',
  'encourages', 'proposes', 'advocates', 'calls for', 'recommends',
  'we propose', 'our delegation proposes', 'the delegation of',
  'adopt', 'implement', 'establish', 'create a', 'fund', 'support',
  'must', 'should', 'urges member states', 'urges all nations',
  'invites all delegations'
];

const SUGGESTED_PHRASES = [
  '"Honorable Chair, distinguished delegates..."',
  '"The delegation of [Country] firmly believes..."',
  '"Notes with deep concern that..."',
  '"Calls upon all member states to..."',
  '"Furthermore, [Country] reaffirms its commitment to..."',
  '"Strongly urges the international community to..."',
  '"The delegation of [Country] yields the floor."',
];

export function analyzeSpeech(
  text: string,
  timeLimitSeconds: number,
  country: string
): SpeechScore {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const lowerText = text.toLowerCase();
  const expectedWords = (timeLimitSeconds / 60) * WORDS_PER_MINUTE;

  // 1. TIMING (15 pts)
  let timingScore = 0;
  let timingFeedback = '';
  const wordRatio = expectedWords > 0 ? wordCount / expectedWords : 0;

  if (wordCount === 0) {
    timingFeedback = 'No speech written yet. Start typing!';
  } else if (wordRatio < 0.3) {
    timingScore = 3;
    timingFeedback = `Way too short — ${wordCount} words written, need ~${Math.round(expectedWords)}. Expand every point with more evidence and reasoning.`;
  } else if (wordRatio < 0.55) {
    timingScore = 7;
    timingFeedback = `A bit short (${wordCount}/${Math.round(expectedWords)} words). Add a statistic or expand your proposed solution.`;
  } else if (wordRatio < 0.8) {
    timingScore = 11;
    timingFeedback = `Getting close (${wordCount}/${Math.round(expectedWords)} words). Add one more sentence to fill the remaining time.`;
  } else if (wordRatio <= 1.08) {
    timingScore = 15;
    timingFeedback = `Excellent timing! ${wordCount} words is perfect for a ${timeLimitSeconds}-second speech.`;
  } else if (wordRatio <= 1.2) {
    timingScore = 10;
    timingFeedback = `Slightly over — ${wordCount} words may run ~${Math.round(wordCount / WORDS_PER_MINUTE * 60)}s. Trim about ${wordCount - Math.round(expectedWords)} words.`;
  } else {
    timingScore = 5;
    timingFeedback = `Too long — you'd be cut off mid-speech. Target ~${Math.round(expectedWords)} words. Cut repetitive phrases and tighten your argument.`;
  }

  // 2. OPENING/CLOSING (15 pts)
  let openingScore = 0;
  let openingFeedback = '';
  const firstChars = lowerText.substring(0, 120);
  const hasOpening = OPENING_PHRASES.some(p => firstChars.includes(p));
  const hasClosing = CLOSING_PHRASES.some(p => lowerText.includes(p));

  if (hasOpening && hasClosing) {
    openingScore = 15;
    openingFeedback = 'Perfect — proper formal address at start and formal yield at end. Judges notice this immediately.';
  } else if (hasOpening) {
    openingScore = 10;
    openingFeedback = 'Good opening! Missing formal closing. Add: "The delegation of [Country] yields the floor."';
  } else if (hasClosing) {
    openingScore = 7;
    openingFeedback = 'Good closing! Start with: "Honorable Chair, distinguished delegates," — it\'s expected at every MUN conference.';
  } else {
    openingScore = 0;
    openingFeedback = 'Missing both formal opening AND closing. This is the easiest 15 points — always address the Chair first.';
  }

  // 3. DIPLOMATIC LANGUAGE (20 pts)
  const foundPhrases = DIPLOMATIC_PHRASES.filter(p => lowerText.includes(p.toLowerCase()));
  const uniquePhrases = [...new Set(foundPhrases)];
  let dipScore = 0;
  let dipFeedback = '';

  if (uniquePhrases.length >= 7) {
    dipScore = 20;
    dipFeedback = `Outstanding diplomatic language — ${uniquePhrases.length} MUN phrases! Your speech sounds like a real delegate.`;
  } else if (uniquePhrases.length >= 5) {
    dipScore = 16;
    dipFeedback = `Strong diplomatic language (${uniquePhrases.length} phrases). Try adding "notes with deep concern" or "reaffirms" for variety.`;
  } else if (uniquePhrases.length >= 3) {
    dipScore = 11;
    dipFeedback = `Some diplomatic language found (${uniquePhrases.length} phrases). Aim for 5+ — replace casual phrases with formal MUN language.`;
  } else if (uniquePhrases.length >= 1) {
    dipScore = 5;
    dipFeedback = `Only ${uniquePhrases.length} diplomatic phrase(s). Judges look for this heavily. Replace "we think" → "it is the position of," "I believe" → "my delegation affirms."`;
  } else {
    dipScore = 0;
    dipFeedback = 'No diplomatic language! This alone drops your score significantly. Start using phrases like "calls upon," "reaffirms," "notes with concern."';
  }

  // 4. COUNTRY POSITION (15 pts)
  let countryScore = 0;
  let countryFeedback = '';
  const countryLower = country.toLowerCase();
  const countryMainWord = countryLower.split(' ').find(w => w.length > 4) || countryLower;

  const hasDelegationLang = lowerText.includes('the delegation of') ||
    lowerText.includes('my delegation') ||
    lowerText.includes('our delegation');
  const hasCountryMention = lowerText.includes(countryMainWord);

  if (hasDelegationLang && hasCountryMention) {
    countryScore = 15;
    countryFeedback = 'Great — you\'re clearly speaking as your delegation and referencing your country\'s position.';
  } else if (hasDelegationLang) {
    countryScore = 10;
    countryFeedback = 'Good delegation language. Try mentioning your country\'s specific policy position or national interest.';
  } else if (hasCountryMention) {
    countryScore = 7;
    countryFeedback = 'You referenced your country, but speak more as a delegation: "The delegation of [Country] firmly believes..."';
  } else {
    countryScore = 2;
    countryFeedback = 'You\'re speaking as yourself, not as a delegation. MUN requires you to represent a country — use "The delegation of [Country]..." throughout.';
  }

  // 5. STRUCTURE (15 pts)
  let structureScore = 0;
  let structureFeedback = '';
  const hasTransitions = /(furthermore|moreover|additionally|however|in conclusion|therefore|consequently|as a result|first(ly)?|second(ly)?|finally|in addition|building on this|additionally)/i.test(text);
  const hasClearIntro = wordCount > 20 && (hasOpening || /(position|delegation believes|firmly|strongly|committed|recognizes)/i.test(lowerText.substring(0, 180)));
  const hasClearConclusion = /(in conclusion|therefore|for these reasons|ultimately|to summarize|hence)/i.test(lowerText) || hasClosing;

  if (hasClearIntro && hasTransitions && hasClearConclusion) {
    structureScore = 15;
    structureFeedback = 'Well-structured — clear intro establishing position, organized body with transitions, and strong conclusion.';
  } else if (hasClearIntro && hasTransitions) {
    structureScore = 11;
    structureFeedback = 'Good structure! Seal it with a conclusion phrase: "For these reasons, the delegation of [Country]..."';
  } else if (hasTransitions) {
    structureScore = 8;
    structureFeedback = 'Good transitions! Strengthen the opening — state your country\'s position in the first 2 sentences.';
  } else if (hasClearIntro) {
    structureScore = 6;
    structureFeedback = 'Good opening, but missing transitions. Use "Furthermore," "However," "In conclusion," to signal structure.';
  } else {
    structureScore = 3;
    structureFeedback = 'Use the APC structure: Address → Position (2-3 points) → Call to action. Every strong MUN speech follows this flow.';
  }

  // 6. EVIDENCE (10 pts)
  const evidenceHits = EVIDENCE_PATTERNS.filter(p => p.test(text));
  let evidenceScore = 0;
  let evidenceFeedback = '';

  if (evidenceHits.length >= 3) {
    evidenceScore = 10;
    evidenceFeedback = 'Excellent evidence — stats, dates, and references show you know your issue. Judges respect this.';
  } else if (evidenceHits.length === 2) {
    evidenceScore = 7;
    evidenceFeedback = 'Good evidence. Add one more specific statistic or reference to a UN resolution/treaty for maximum impact.';
  } else if (evidenceHits.length === 1) {
    evidenceScore = 4;
    evidenceFeedback = 'Include more evidence. Even one strong statistic ("X% of refugees lack...") makes your argument 10x more credible.';
  } else {
    evidenceScore = 0;
    evidenceFeedback = 'No evidence found! Back up every claim with stats, dates, or treaty references. Unsupported claims lose to delegates who cite facts.';
  }

  // 7. CALL TO ACTION (10 pts)
  const ctaFound = CTA_PHRASES.filter(p => lowerText.includes(p));
  let ctaScore = 0;
  let ctaFeedback = '';

  if (ctaFound.length >= 3) {
    ctaScore = 10;
    ctaFeedback = 'Strong, clear call to action — other delegates know exactly what you want them to do.';
  } else if (ctaFound.length >= 2) {
    ctaScore = 7;
    ctaFeedback = 'Good proposals. Be even more specific — name a mechanism, a fund, or a resolution clause you support.';
  } else if (ctaFound.length === 1) {
    ctaScore = 4;
    ctaFeedback = 'Weak call to action. What specifically should the UN DO? Use "calls upon member states to..." with concrete proposals.';
  } else {
    ctaScore = 0;
    ctaFeedback = 'No call to action! The whole point of a MUN speech is to move other delegates. Tell them what to support or do.';
  }

  const total = timingScore + openingScore + dipScore + countryScore + structureScore + evidenceScore + ctaScore;

  let badge = '', badgeColor = '', badgeEmoji = '';
  if (total >= 90) {
    badge = 'Distinguished Delegate'; badgeColor = 'text-yellow-400'; badgeEmoji = '🏆';
  } else if (total >= 75) {
    badge = 'Outstanding Delegate'; badgeColor = 'text-blue-400'; badgeEmoji = '⭐';
  } else if (total >= 60) {
    badge = 'Best Delegate Potential'; badgeColor = 'text-green-400'; badgeEmoji = '🌟';
  } else if (total >= 45) {
    badge = 'Honorable Mention'; badgeColor = 'text-purple-400'; badgeEmoji = '📜';
  } else {
    badge = 'Delegate (Keep Going!)'; badgeColor = 'text-gray-400'; badgeEmoji = '🎯';
  }

  const generalTips: string[] = [];
  if (total < 50) {
    generalTips.push('Watch videos of Distinguished Delegate speeches from NMUN, NAIMUN, or HMUN — see the structure and language in action.');
    generalTips.push('Print a "diplomatic language cheat sheet" and force yourself to use every phrase at least once before your conference.');
  }
  if (dipScore < 10) {
    generalTips.push('Underline every casual phrase in your speech (I think, we want, it\'s good) and replace with formal diplomatic equivalents.');
  }
  if (evidenceScore < 5) {
    generalTips.push('Research 5 specific statistics about your topic and country before practicing. Having real data changes how you speak.');
  }
  if (structureScore < 8) {
    generalTips.push('Write your speech in three labeled sections first (Position / Evidence / Proposal), then merge them naturally — the structure will show.');
  }
  if (timingScore < 8 && wordCount > 0) {
    generalTips.push('Record yourself speaking the speech out loud. Reading speed and speaking speed are very different — speaking is always slower.');
  }

  return {
    total,
    categories: {
      timing: { score: timingScore, max: 15, feedback: timingFeedback },
      opening: { score: openingScore, max: 15, feedback: openingFeedback },
      diplomaticLanguage: { score: dipScore, max: 20, feedback: dipFeedback, found: uniquePhrases.slice(0, 8) },
      countryPosition: { score: countryScore, max: 15, feedback: countryFeedback },
      structure: { score: structureScore, max: 15, feedback: structureFeedback },
      evidence: { score: evidenceScore, max: 10, feedback: evidenceFeedback },
      callToAction: { score: ctaScore, max: 10, feedback: ctaFeedback },
    },
    badge,
    badgeColor,
    badgeEmoji,
    generalTips,
    samplePhrases: SUGGESTED_PHRASES,
  };
}
