import {
  LostReport,
  FoundReport,
  ClaimRequest,
  InAppNotification,
  MatchCandidate,
  DuplicateReportGroup,
  TestResultItem,
  ItemCategory
} from '../types';

export interface SystemStats {
  totalLost: number;
  totalFound: number;
  activeLost: number;
  activeFound: number;
  resolvedReports: number;
  pendingClaims: number;
  approvedClaims: number;
  geminiActive: boolean;
}

export interface HealthInfo {
  status: string;
  geminiConfigured: boolean;
  embeddingModel: string;
  generationModel: string;
  totalLost: number;
  totalFound: number;
  totalClaims: number;
}

const API_BASE = '/api';

export const api = {
  async getHealth(): Promise<HealthInfo> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch statistics');
    return res.json();
  },

  async getLostReports(params?: { category?: string; search?: string; status?: string }): Promise<LostReport[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/reports/lost?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch lost reports');
    return res.json();
  },

  async createLostReport(data: Partial<LostReport>): Promise<{ report: LostReport; matchesCount: number; topMatches: MatchCandidate[] }> {
    const res = await fetch(`${API_BASE}/reports/lost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || 'Failed to submit lost report');
    }
    return res.json();
  },

  async getFoundReports(params?: { category?: string; search?: string; status?: string }): Promise<FoundReport[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/reports/found?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch found reports');
    return res.json();
  },

  async createFoundReport(data: Partial<FoundReport>): Promise<{ report: FoundReport; matchedLostReports: string[] }> {
    const res = await fetch(`${API_BASE}/reports/found`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || 'Failed to submit found report');
    }
    return res.json();
  },

  async getReportById(id: string): Promise<LostReport | FoundReport> {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    if (!res.ok) throw new Error('Report not found');
    return res.json();
  },

  async updateReport(id: string, updates: Partial<LostReport | FoundReport>): Promise<LostReport | FoundReport> {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update report');
    return res.json();
  },

  async deleteReport(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete report');
    return res.json();
  },

  async matchLostItem(params: {
    lostReportId?: string;
    lostReport?: LostReport;
    threshold?: number;
    limit?: number;
  }): Promise<{ lostReport: LostReport; matches: MatchCandidate[]; thresholdUsed: number }> {
    const res = await fetch(`${API_BASE}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Matching failed' }));
      throw new Error(err.error || 'Failed to compute matches');
    }
    return res.json();
  },

  async searchFoundItems(params: {
    query: string;
    category?: string;
    location?: string;
    threshold?: number;
  }): Promise<{ query: string; matches: MatchCandidate[] }> {
    const res = await fetch(`${API_BASE}/match/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Search failed' }));
      throw new Error(err.error || 'Search request failed');
    }
    return res.json();
  },

  async getClaims(): Promise<ClaimRequest[]> {
    const res = await fetch(`${API_BASE}/claims`);
    if (!res.ok) throw new Error('Failed to fetch claims');
    return res.json();
  },

  async submitClaim(claimData: {
    foundReportId: string;
    lostReportId?: string;
    claimantName: string;
    claimantEmail: string;
    claimantPhone?: string;
    verificationAnswers: string;
  }): Promise<ClaimRequest> {
    const res = await fetch(`${API_BASE}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit claim' }));
      throw new Error(err.error || 'Claim submission error');
    }
    return res.json();
  },

  async updateClaim(id: string, updates: { status: string; reviewerNotes?: string }, adminToken?: string): Promise<ClaimRequest> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const res = await fetch(`${API_BASE}/claims/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unauthorized or invalid status' }));
      throw new Error(err.error || 'Claim update failed');
    }
    return res.json();
  },

  async getNotifications(): Promise<InAppNotification[]> {
    const res = await fetch(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<InAppNotification> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to update notification');
    return res.json();
  },

  async getAdminDuplicates(adminToken: string): Promise<DuplicateReportGroup[]> {
    const res = await fetch(`${API_BASE}/admin/duplicates`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unauthorized' }));
      throw new Error(err.error || 'Failed to detect duplicates');
    }
    return res.json();
  },

  async resetSeedData(adminToken: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/reset-seed`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('Failed to reset dataset');
    return res.json();
  },

  async runTestSuite(): Promise<{
    results: TestResultItem[];
    totalPassed: number;
    totalFailed: number;
    totalDurationMs: number;
    summary: string;
  }> {
    const res = await fetch(`${API_BASE}/test-suite`);
    if (!res.ok) throw new Error('Failed to execute test suite');
    return res.json();
  }
};
