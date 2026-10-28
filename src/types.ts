export type ItemCategory =
  | 'electronics'
  | 'bags'
  | 'clothing'
  | 'books'
  | 'stationery'
  | 'keys'
  | 'wallets'
  | 'bottles'
  | 'jewellery'
  | 'documents'
  | 'other';

export type ReportStatus = 'active' | 'claimed' | 'resolved' | 'archived';

export type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'returned';

export interface BaseReport {
  id: string;
  title: string;
  category: ItemCategory;
  description: string;
  color: string;
  brand: string;
  location: string;
  date: string;
  time: string;
  imageUrl?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  isContactPrivate: boolean;
  status: ReportStatus;
  createdAt: string;
  embedding?: number[];
}

export interface LostReport extends BaseReport {
  type: 'lost';
  identifyingFeatures: string;
  reward?: string;
}

export interface FoundReport extends BaseReport {
  type: 'found';
  visibleFeatures: string;
  storageLocation: string; // e.g. "Main Campus Security Desk (Desk B)"
  verificationPrompt: string; // question to verify claimant
}

export interface MatchScoreBreakdown {
  semanticScore: number; // 0-100
  categoryScore: number; // 0-100
  colorBrandScore: number; // 0-100
  locationScore: number; // 0-100
  dateScore: number; // 0-100
  identifyingScore: number; // 0-100
  penaltyScore: number; // 0 to -30 for contradictions
  overallScore: number; // 0-100 weighted
  relevanceLabel: 'Strong Candidate' | 'Possible Match' | 'Low Similarity';
  matchingFactors: string[];
  conflictingFactors: string[];
  aiExplanation: string;
  isAiGeneratedExplanation: boolean;
  embeddingMethodUsed: 'gemini-embedding-2-preview' | 'tfidf-synset-fallback';
}

export interface MatchCandidate {
  foundReport: FoundReport;
  breakdown: MatchScoreBreakdown;
}

export interface ClaimRequest {
  id: string;
  foundReportId: string;
  lostReportId?: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  verificationAnswers: string;
  status: ClaimStatus;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'match_found' | 'claim_update' | 'admin_alert';
  reportId?: string;
  timestamp: string;
  read: boolean;
}

export interface DuplicateReportGroup {
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
}

export interface TestResultItem {
  id: string;
  category: string;
  name: string;
  description: string;
  passed: boolean;
  details: string;
  actualScore?: number;
  expectedScoreThreshold?: string;
  executionTimeMs: number;
}
