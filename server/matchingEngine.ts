import { LostReport, FoundReport, MatchScoreBreakdown, MatchCandidate, ItemCategory } from '../src/types';
import { getGeminiClient, isGeminiConfigured } from './geminiClient';

// Cache for calculated embeddings to avoid redundant network calls
const embeddingCache = new Map<string, number[]>();

// Synsets and semantic concept mappings
const COLOR_SYNONYM_GROUPS: string[][] = [
  ['blue', 'navy', 'dark blue', 'light blue', 'cyan', 'azure', 'indigo', 'sapphire'],
  ['black', 'dark', 'charcoal', 'matte black', 'jet black', 'dark grey'],
  ['grey', 'gray', 'silver', 'space grey', 'slate', 'graphite', 'aluminum', 'chrome'],
  ['white', 'ivory', 'cream', 'clear', 'transparent', 'off-white'],
  ['brown', 'tan', 'beige', 'khaki', 'cognac', 'caramel', 'chocolate'],
  ['red', 'crimson', 'maroon', 'burgundy', 'scarlet', 'ruby'],
  ['gold', 'yellow', 'brass', 'bronze', 'metallic yellow'],
  ['green', 'emerald', 'olive', 'lime', 'forest green', 'mint'],
  ['purple', 'violet', 'lavender', 'magenta', 'lilac'],
  ['orange', 'peach', 'coral', 'amber', 'rust'],
  ['pink', 'rose', 'blush', 'salmon']
];

const LOCATION_SYNONYM_GROUPS: string[][] = [
  ['library', 'reading room', 'study carrel', 'stacks', 'book archive', 'study hall'],
  ['cafeteria', 'dining hall', 'canteen', 'food court', 'tray return', 'bistro'],
  ['gym', 'gymnasium', 'recreation center', 'sports center', 'locker room', 'fitness', 'athletic center'],
  ['auditorium', 'lecture hall', 'hall a', 'hall b', 'main theatre', 'symposium'],
  ['lab', 'laboratory', 'computer lab', 'informatics', 'cs lab', 'engineering lab'],
  ['dorm', 'dormitory', 'residence hall', 'reslife', 'quadrangle', 'breezeway'],
  ['quad', 'courtyard', 'stone benches', 'outdoor lawn', 'campus center lawn', 'plaza'],
  ['registrar', 'administration', 'student services', 'admissions', 'cashier counter'],
  ['music', 'sound studio', 'practice room', 'recording booth', 'auditorium annex']
];

const COMPATIBLE_CATEGORIES: Record<ItemCategory, ItemCategory[]> = {
  electronics: ['stationery', 'other'],
  bags: ['wallets', 'clothing', 'other'],
  clothing: ['bags', 'other'],
  books: ['documents', 'stationery', 'other'],
  stationery: ['books', 'documents', 'other'],
  keys: ['other'],
  wallets: ['bags', 'documents', 'other'],
  bottles: ['other'],
  jewellery: ['other'],
  documents: ['books', 'stationery', 'wallets', 'other'],
  other: ['electronics', 'bags', 'clothing', 'books', 'stationery', 'keys', 'wallets', 'bottles', 'jewellery', 'documents']
};

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Compute dot product of two vectors
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

// Compute magnitude of vector
function magnitude(vec: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

// Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  const sim = dotProduct(a, b) / (magA * magB);
  // Clamp between -1 and 1
  return Math.max(-1, Math.min(1, sim));
}

// High-fidelity local token TF-IDF & Synset vector generator for fallback
function generateLocalVector(text: string): number[] {
  const norm = normalizeText(text);
  const tokens = norm.split(' ').filter(t => t.length > 2);
  const vectorDim = 128;
  const vec = new Float64Array(vectorDim);

  for (const token of tokens) {
    // Hash token to dimension
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % vectorDim;
    vec[idx] += 1.0;

    // Check synonym group enrichment
    for (let g = 0; g < COLOR_SYNONYM_GROUPS.length; g++) {
      if (COLOR_SYNONYM_GROUPS[g].some(syn => syn.includes(token) || token.includes(syn))) {
        vec[(g * 7 + 13) % vectorDim] += 0.8;
      }
    }

    for (let g = 0; g < LOCATION_SYNONYM_GROUPS.length; g++) {
      if (LOCATION_SYNONYM_GROUPS[g].some(syn => syn.includes(token) || token.includes(syn))) {
        vec[(g * 9 + 41) % vectorDim] += 0.8;
      }
    }
  }

  // Normalize
  let mag = 0;
  for (let i = 0; i < vectorDim; i++) mag += vec[i] * vec[i];
  mag = Math.sqrt(mag);
  if (mag > 0) {
    for (let i = 0; i < vectorDim; i++) vec[i] /= mag;
  }
  return Array.from(vec);
}

// Generate embedding using Gemini if configured, else fallback
export async function getEmbedding(text: string): Promise<{ vector: number[]; method: 'gemini-embedding-2-preview' | 'tfidf-synset-fallback' }> {
  const clean = text.trim();
  if (embeddingCache.has(clean)) {
    return {
      vector: embeddingCache.get(clean)!,
      method: isGeminiConfigured() ? 'gemini-embedding-2-preview' : 'tfidf-synset-fallback'
    };
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      // Use standard modern embedding model
      const result = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: clean,
      });

      const vector = result.embeddings?.[0]?.values ||
        (result as unknown as { embedding?: { values?: number[] } }).embedding?.values;

      if (vector && Array.isArray(vector) && vector.length > 0) {
        embeddingCache.set(clean, vector);
        return { vector, method: 'gemini-embedding-2-preview' };
      }
    } catch (err) {
      console.warn('Gemini embedContent failed, falling back to local synset vector:', err instanceof Error ? err.message : String(err));
    }
  }

  // Fallback to deterministic local semantic vector
  const fallbackVec = generateLocalVector(clean);
  embeddingCache.set(clean, fallbackVec);
  return { vector: fallbackVec, method: 'tfidf-synset-fallback' };
}

// Compare colors
function compareColors(colorA: string, colorB: string): { score: number; matchDescription?: string } {
  const normA = normalizeText(colorA);
  const normB = normalizeText(colorB);

  if (!normA || !normB) return { score: 50 }; // Neutral if unstated
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return { score: 100, matchDescription: `Colors match directly: "${colorA}" and "${colorB}"` };
  }

  for (const group of COLOR_SYNONYM_GROUPS) {
    const hasA = group.some(c => normA.includes(c));
    const hasB = group.some(c => normB.includes(c));
    if (hasA && hasB) {
      return { score: 85, matchDescription: `Colors are related shades: "${colorA}" and "${colorB}"` };
    }
  }

  return { score: 15 };
}

// Compare brands
function compareBrands(brandA: string, brandB: string): { score: number; matchDescription?: string; conflicting?: string } {
  const normA = normalizeText(brandA);
  const normB = normalizeText(brandB);

  if (!normA || !normB || normA === 'unbranded' || normB === 'unbranded' || normA === 'unmarked' || normB === 'unmarked' || normA === 'generic' || normB === 'generic') {
    return { score: 60 }; // Unstated brand is not penalizing
  }

  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return { score: 100, matchDescription: `Brand verified match: "${brandA}"` };
  }

  return { score: 20, conflicting: `Divergent brands: "${brandA}" vs "${brandB}"` };
}

// Compare locations
function compareLocations(locA: string, locB: string): { score: number; matchDescription?: string } {
  const normA = normalizeText(locA);
  const normB = normalizeText(locB);

  if (!normA || !normB) return { score: 50 };
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return { score: 100, matchDescription: `Same location zone: "${locA}" and "${locB}"` };
  }

  for (const group of LOCATION_SYNONYM_GROUPS) {
    const hasA = group.some(k => normA.includes(k));
    const hasB = group.some(k => normB.includes(k));
    if (hasA && hasB) {
      return { score: 85, matchDescription: `Related campus location cluster: "${locA}" and "${locB}"` };
    }
  }

  return { score: 40 };
}

// Compare dates
function compareDates(lostDateStr: string, foundDateStr: string): { score: number; note?: string; conflicting?: string } {
  if (!lostDateStr || !foundDateStr) return { score: 50 };

  const lostTime = new Date(lostDateStr).getTime();
  const foundTime = new Date(foundDateStr).getTime();

  if (isNaN(lostTime) || isNaN(foundTime)) return { score: 50 };

  const diffDays = (foundTime - lostTime) / (1000 * 60 * 60 * 24);

  // Item found on the same day or within 3 days after lost
  if (diffDays >= 0 && diffDays <= 3) {
    return { score: 100, note: `Found ${diffDays === 0 ? 'same day' : `${Math.round(diffDays)} days after`} lost date.` };
  }
  // Found within 4 to 10 days after lost
  if (diffDays > 3 && diffDays <= 10) {
    return { score: 85, note: `Found ${Math.round(diffDays)} days after lost date.` };
  }
  // Found within 11 to 30 days after lost
  if (diffDays > 10 && diffDays <= 30) {
    return { score: 65, note: `Found within a month of lost date.` };
  }
  // Found more than 30 days after
  if (diffDays > 30) {
    return { score: 45, note: `Found significantly later (${Math.round(diffDays)} days).` };
  }

  // Found BEFORE lost date: could be slight human error in report date (e.g. 1-2 days) or contradictory
  if (diffDays < 0 && diffDays >= -2) {
    return { score: 40, note: `Found date slightly precedes estimated lost date (within 48h margin of user recall).` };
  }

  // Found far before lost date: contradictory
  return {
    score: 10,
    conflicting: `Item was found ${Math.abs(Math.round(diffDays))} days before the reported lost date.`
  };
}

// Generate synthesis explanation using Gemini or algorithmic template
async function generateMatchExplanation(
  lost: LostReport,
  found: FoundReport,
  breakdown: Omit<MatchScoreBreakdown, 'aiExplanation' | 'isAiGeneratedExplanation'>
): Promise<{ text: string; isAi: boolean }> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are the AI Semantic Matching Assistant for a university Lost & Found system.
Evaluate this potential match between a Lost Report and a Found Report.

LOST REPORT:
- Title: ${lost.title}
- Category: ${lost.category}
- Description: ${lost.description}
- Color: ${lost.color}
- Brand: ${lost.brand}
- Identifying Features: ${lost.identifyingFeatures || 'None'}
- Location: ${lost.location}
- Date: ${lost.date}

FOUND REPORT:
- Title: ${found.title}
- Category: ${found.category}
- Description: ${found.description}
- Color: ${found.color}
- Brand: ${found.brand}
- Visible Features: ${found.visibleFeatures || 'None'}
- Found Location: ${found.location}
- Date Found: ${found.date}

COMPUTED METRICS:
- Semantic Embedding Similarity: ${breakdown.semanticScore.toFixed(1)}%
- Category Match: ${breakdown.categoryScore}%
- Overall Composite Score: ${breakdown.overallScore.toFixed(1)}% (${breakdown.relevanceLabel})

Provide a transparent, balanced 2-sentence explanation of why this item is or isn't a likely match, noting shared characteristics and what detail the claimant should verify.
Never declare absolute proof of ownership.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const explanation = response.text?.trim();
      if (explanation && explanation.length > 20) {
        return { text: explanation, isAi: true };
      }
    } catch (e) {
      console.warn('Gemini explanation generation skipped, using structured explanation:', e instanceof Error ? e.message : String(e));
    }
  }

  // High-fidelity structured explanation
  let explanation = '';
  if (breakdown.overallScore >= 75) {
    explanation = `High semantic similarity (${breakdown.semanticScore.toFixed(0)}%) with matching ${lost.category} classification and aligned location (${lost.location} ~ ${found.location}). Shared characteristics strongly suggest a potential match. Please verify specific details (${found.verificationPrompt || 'serial number/marks'}) before physical claiming.`;
  } else if (breakdown.overallScore >= 50) {
    explanation = `Moderate contextual overlap (${breakdown.overallScore.toFixed(0)}%). Descriptions share comparable terminology and color palettes, but differences in reported locations or time intervals require careful verification.`;
  } else {
    explanation = `Low contextual compatibility (${breakdown.overallScore.toFixed(0)}%). Key characteristics or timing diverge significantly, though there are minor keyword or category parallels.`;
  }

  return { text: explanation, isAi: false };
}

// Master evaluation function between a Lost Report and a Found Report
export async function evaluateMatch(
  lost: LostReport,
  found: FoundReport,
  generateExplanation: boolean = true
): Promise<MatchScoreBreakdown> {
  const matchingFactors: string[] = [];
  const conflictingFactors: string[] = [];

  // 1. Text embedding & Semantic Cosine Similarity (Weight 50%)
  const lostText = `${lost.title}. Category: ${lost.category}. ${lost.description}. Color: ${lost.color}. Brand: ${lost.brand || ''}. Features: ${lost.identifyingFeatures || ''}. Location: ${lost.location}.`;
  const foundText = `${found.title}. Category: ${found.category}. ${found.description}. Color: ${found.color}. Brand: ${found.brand || ''}. Visible features: ${found.visibleFeatures || ''}. Location: ${found.location}.`;

  const [lostEmb, foundEmb] = await Promise.all([
    getEmbedding(lostText),
    getEmbedding(foundText)
  ]);

  const rawCosine = cosineSimilarity(lostEmb.vector, foundEmb.vector);
  // Normalize cosine similarity from [-1, 1] to [0, 100]
  // In practice, positive semantic vectors lie between 0.3 and 1.0
  const normalizedSemantic = Math.max(0, Math.min(100, Math.round(((rawCosine + 0.2) / 1.2) * 100)));

  if (normalizedSemantic >= 70) {
    matchingFactors.push(`High natural language semantic similarity (${normalizedSemantic}%) between item descriptions.`);
  }

  // 2. Category Scoring (Weight 15%)
  let categoryScore = 0;
  if (lost.category === found.category) {
    categoryScore = 100;
    matchingFactors.push(`Exact category match: "${lost.category}".`);
  } else if (COMPATIBLE_CATEGORIES[lost.category]?.includes(found.category)) {
    categoryScore = 55;
    matchingFactors.push(`Compatible category context: "${lost.category}" relates to "${found.category}".`);
  } else {
    categoryScore = 10;
    conflictingFactors.push(`Category mismatch: "${lost.category}" vs "${found.category}".`);
  }

  // 3. Color & Brand Scoring (Weight 15%)
  const colorResult = compareColors(lost.color, found.color);
  const brandResult = compareBrands(lost.brand, found.brand);
  const colorBrandScore = Math.round((colorResult.score * 0.6) + (brandResult.score * 0.4));

  if (colorResult.matchDescription) matchingFactors.push(colorResult.matchDescription);
  if (brandResult.matchDescription) matchingFactors.push(brandResult.matchDescription);
  if (brandResult.conflicting) conflictingFactors.push(brandResult.conflicting);

  // 4. Location Context Scoring (Weight 10%)
  const locResult = compareLocations(lost.location, found.location);
  const locationScore = locResult.score;
  if (locResult.matchDescription) matchingFactors.push(locResult.matchDescription);

  // 5. Date & Time Compatibility (Weight 10%)
  const dateResult = compareDates(lost.date, found.date);
  const dateScore = dateResult.score;
  if (dateResult.note) matchingFactors.push(dateResult.note);
  if (dateResult.conflicting) conflictingFactors.push(dateResult.conflicting);

  // 6. Identifying Features Overlap
  let identifyingScore = 50;
  if (lost.identifyingFeatures && found.visibleFeatures) {
    const normId = normalizeText(lost.identifyingFeatures);
    const normVis = normalizeText(found.visibleFeatures);
    const idTokens = normId.split(' ').filter(t => t.length > 3);
    const matchCount = idTokens.filter(t => normVis.includes(t)).length;
    if (matchCount >= 2) {
      identifyingScore = 95;
      matchingFactors.push(`Shared distinguishing characteristics detected in notes/features.`);
    } else if (matchCount === 1) {
      identifyingScore = 75;
    }
  }

  // Contradiction penalties
  let penaltyScore = 0;
  if (categoryScore < 20 && colorResult.score < 20) {
    penaltyScore = -25; // Strongly contradictory category + conflicting color
    conflictingFactors.push(`Severe attribute divergence (incompatible category and disparate color).`);
  } else if (categoryScore < 20) {
    penaltyScore = -15;
  }

  // Weighted Composite Score
  // Weights: Semantic 50%, Category 15%, Color/Brand 15%, Location 10%, Date 10%
  const weightedBase =
    (normalizedSemantic * 0.50) +
    (categoryScore * 0.15) +
    (colorBrandScore * 0.15) +
    (locationScore * 0.10) +
    (dateScore * 0.10);

  const finalScore = Math.max(0, Math.min(100, Math.round(weightedBase + penaltyScore)));

  let relevanceLabel: 'Strong Candidate' | 'Possible Match' | 'Low Similarity';
  if (finalScore >= 75) {
    relevanceLabel = 'Strong Candidate';
  } else if (finalScore >= 50) {
    relevanceLabel = 'Possible Match';
  } else {
    relevanceLabel = 'Low Similarity';
  }

  const breakdownWithoutExpl: Omit<MatchScoreBreakdown, 'aiExplanation' | 'isAiGeneratedExplanation'> = {
    semanticScore: normalizedSemantic,
    categoryScore,
    colorBrandScore,
    locationScore,
    dateScore,
    identifyingScore,
    penaltyScore,
    overallScore: finalScore,
    relevanceLabel,
    matchingFactors,
    conflictingFactors,
    embeddingMethodUsed: lostEmb.method
  };

  let explanationText = '';
  let isAi = false;

  if (generateExplanation) {
    const result = await generateMatchExplanation(lost, found, breakdownWithoutExpl);
    explanationText = result.text;
    isAi = result.isAi;
  }

  return {
    ...breakdownWithoutExpl,
    aiExplanation: explanationText,
    isAiGeneratedExplanation: isAi
  };
}

// Find top candidate matches for a given lost report against all found reports
export async function matchLostReport(
  lost: LostReport,
  foundReports: FoundReport[],
  threshold: number = 40,
  limit: number = 5
): Promise<MatchCandidate[]> {
  const candidates: MatchCandidate[] = [];

  for (const found of foundReports) {
    if (found.status === 'archived' || found.status === 'resolved') continue;
    const breakdown = await evaluateMatch(lost, found, true);
    if (breakdown.overallScore >= threshold) {
      candidates.push({ foundReport: found, breakdown });
    }
  }

  // Sort by overallScore descending
  candidates.sort((a, b) => b.breakdown.overallScore - a.breakdown.overallScore);

  return candidates.slice(0, limit);
}

// Detect potential duplicates within lost reports or found reports
export async function detectDuplicates(reports: Array<LostReport | FoundReport>): Promise<Array<{
  groupKey: string;
  category: ItemCategory;
  reports: Array<{
    id: string;
    title: string;
    type: 'lost' | 'found';
    description: string;
    location: string;
    date: string;
    similarity: number;
  }>;
  reason: string;
}>> {
  const duplicates: Array<{
    groupKey: string;
    category: ItemCategory;
    reports: Array<{
      id: string;
      title: string;
      type: 'lost' | 'found';
      description: string;
      location: string;
      date: string;
      similarity: number;
    }>;
    reason: string;
  }> = [];

  const checked = new Set<string>();

  for (let i = 0; i < reports.length; i++) {
    const repA = reports[i];
    if (checked.has(repA.id)) continue;

    const group: Array<{
      id: string;
      title: string;
      type: 'lost' | 'found';
      description: string;
      location: string;
      date: string;
      similarity: number;
    }> = [
      {
        id: repA.id,
        title: repA.title,
        type: repA.type,
        description: repA.description,
        location: repA.location,
        date: repA.date,
        similarity: 100
      }
    ];

    for (let j = i + 1; j < reports.length; j++) {
      const repB = reports[j];
      if (repA.type !== repB.type) continue; // Only compare lost with lost, found with found
      if (repA.category !== repB.category) continue;

      const textA = `${repA.title} ${repA.description} ${repA.color} ${repA.brand || ''}`;
      const textB = `${repB.title} ${repB.description} ${repB.color} ${repB.brand || ''}`;

      const [embA, embB] = await Promise.all([getEmbedding(textA), getEmbedding(textB)]);
      const cos = cosineSimilarity(embA.vector, embB.vector);
      const similarity = Math.round(cos * 100);

      // Duplicate threshold: >= 82% similarity in same category
      if (similarity >= 82) {
        checked.add(repB.id);
        group.push({
          id: repB.id,
          title: repB.title,
          type: repB.type,
          description: repB.description,
          location: repB.location,
          date: repB.date,
          similarity
        });
      }
    }

    if (group.length > 1) {
      checked.add(repA.id);
      duplicates.push({
        groupKey: `dup-${repA.category}-${repA.id}`,
        category: repA.category,
        reports: group,
        reason: `High semantic description overlap (>=82%) within same category "${repA.category}".`
      });
    }
  }

  return duplicates;
}
