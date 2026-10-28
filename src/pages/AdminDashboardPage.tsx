import React, { useState, useEffect } from 'react';
import {
  LostReport,
  FoundReport,
  ClaimRequest,
  DuplicateReportGroup,
  ClaimStatus
} from '../types';
import { api, SystemStats } from '../services/api';
import {
  ShieldAlert,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ExternalLink,
  Users,
  Copy,
  Layers,
  FileText,
  Search,
  Building
} from 'lucide-react';

interface AdminDashboardPageProps {
  adminToken: string;
  setAdminToken: (token: string) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  adminToken,
  setAdminToken,
  isAdmin,
  setIsAdmin
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [foundReports, setFoundReports] = useState<FoundReport[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateReportGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dupLoading, setDupLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<'claims' | 'duplicates' | 'reports'>('claims');

  // Input for modifying claim
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, c, l, f] = await Promise.all([
        api.getStats(),
        api.getClaims(),
        api.getLostReports(),
        api.getFoundReports()
      ]);
      setStats(s);
      setClaims(c);
      setLostReports(l);
      setFoundReports(f);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRunDuplicateDetection = async () => {
    setDupLoading(true);
    try {
      const result = await api.getAdminDuplicates(adminToken);
      setDuplicates(result);
      setActionMessage(`Detected ${result.length} duplicate clusters across reports.`);
    } catch (e) {
      setActionMessage('Failed to run duplicate detection: Authentication required.');
    } finally {
      setDupLoading(false);
    }
  };

  const handleUpdateClaimStatus = async (claimId: string, newStatus: ClaimStatus) => {
    try {
      await api.updateClaim(
        claimId,
        {
          status: newStatus,
          reviewerNotes: reviewerNotes || `Status updated to ${newStatus} by campus administrator.`
        },
        adminToken
      );
      setActionMessage(`Claim #${claimId} successfully set to "${newStatus.toUpperCase()}".`);
      setEditingClaimId(null);
      setReviewerNotes('');
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Claim status update failed');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm('Permanently remove this report from the database?')) {
      try {
        await api.deleteReport(id);
        setActionMessage(`Report #${id} deleted.`);
        loadAll();
      } catch (e) {
        alert('Delete failed');
      }
    }
  };

  const handleResetSeedData = async () => {
    if (confirm('Reset entire system database to standard 10 lost & 12 found seed dataset?')) {
      try {
        await api.resetSeedData(adminToken);
        setActionMessage('Database restored to initial seed dataset.');
        loadAll();
      } catch (e) {
        alert('Failed to reset dataset: Unauthorized.');
      }
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto text-xs text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>Institutional Governance & Moderation Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Administrator Portal
          </h1>
          <p className="text-slate-400 mt-1">
            Enforces backend RBAC security. Manage ownership claims, run duplicate report clustering, and audit system records.
          </p>
        </div>

        {/* Database Reset Action */}
        <button
          type="button"
          onClick={handleResetSeedData}
          className="px-4 py-2 font-semibold text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Dataset</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-xl text-blue-200 font-medium flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-blue-400 hover:text-blue-200 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xs">
          <span className="text-slate-400 font-medium">Pending Claims</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats?.pendingClaims ?? 0}</div>
          <span className="text-[10px] text-slate-500">Awaiting ownership review</span>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xs">
          <span className="text-slate-400 font-medium">Approved Claims</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats?.approvedClaims ?? 0}</div>
          <span className="text-[10px] text-slate-500">Ownership confirmed</span>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xs">
          <span className="text-slate-400 font-medium">Active Lost Reports</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">{stats?.activeLost ?? 0}</div>
          <span className="text-[10px] text-slate-500">Unresolved lost items</span>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xs">
          <span className="text-slate-400 font-medium">In Custody Found</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">{stats?.activeFound ?? 0}</div>
          <span className="text-[10px] text-slate-500">Held at campus stations</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveAdminTab('claims')}
          className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
            activeAdminTab === 'claims'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Claims Verification Queue ({claims.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('duplicates')}
          className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
            activeAdminTab === 'duplicates'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Duplicate Report Detection
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('reports')}
          className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
            activeAdminTab === 'reports'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Report Moderation ({lostReports.length + foundReports.length} total)
        </button>
      </div>

      {/* Tab 1: Claims Verification Queue */}
      {activeAdminTab === 'claims' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-950 border-b border-slate-800 font-semibold text-white flex justify-between items-center">
            <span>Submitted Ownership Claims</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Review claimant responses against found item prompts.
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {claims.map(claim => {
              const found = foundReports.find(r => r.id === claim.foundReportId);
              const isEditing = editingClaimId === claim.id;

              return (
                <div key={claim.id} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">Claim #{claim.id}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 font-medium">Claimant: {claim.claimantName}</span>
                        <span className="text-slate-500">({claim.claimantEmail})</span>
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        Claimed Item: <strong className="text-slate-200">{found?.title || `Item #${claim.foundReportId}`}</strong> (Storage: {found?.storageLocation || 'Unknown'})
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full font-bold text-xs self-start sm:self-auto ${
                      claim.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      claim.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      claim.status === 'under_review' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {claim.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Finder's Verification Prompt vs Claimant Answer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl">
                      <strong className="block text-amber-300 mb-1">Finder's Verification Question:</strong>
                      <p className="text-amber-200 italic">
                        "{found?.verificationPrompt || 'None specified'}"
                      </p>
                    </div>

                    <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl">
                      <strong className="block text-blue-300 mb-1">Claimant's Proof of Ownership:</strong>
                      <p className="text-blue-100">
                        "{claim.verificationAnswers}"
                      </p>
                    </div>
                  </div>

                  {claim.reviewerNotes && (
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                      <strong className="text-white">Current Reviewer Note:</strong> {claim.reviewerNotes}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500">
                      Filed: {new Date(claim.createdAt).toLocaleString()}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full pt-2">
                          <input
                            type="text"
                            value={reviewerNotes}
                            onChange={e => setReviewerNotes(e.target.value)}
                            placeholder="Add administrative review notes..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-xs"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
                              className="px-3 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateClaimStatus(claim.id, 'rejected')}
                              className="px-3 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateClaimStatus(claim.id, 'returned')}
                              className="px-3 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                            >
                              Mark Handed Over
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingClaimId(null)}
                              className="px-2.5 py-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingClaimId(claim.id);
                              setReviewerNotes(claim.reviewerNotes || '');
                            }}
                            className="px-3 py-1 font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            Review & Modify Status
                          </button>
                          {claim.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateClaimStatus(claim.id, 'under_review')}
                              className="px-3 py-1 font-semibold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 rounded-lg transition-colors"
                            >
                              Set Under Review
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Duplicate Report Detection */}
      {activeAdminTab === 'duplicates' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Copy className="w-4 h-4 text-blue-400" />
                <span>AI Duplicate Report Clustering Engine</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Computes pairwise semantic similarities across report queues to flag accidental duplicate postings.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunDuplicateDetection}
              disabled={dupLoading}
              className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{dupLoading ? 'Scanning Vectors...' : 'Run Duplicate Scan'}</span>
            </button>
          </div>

          {duplicates.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-300">No duplicate clusters flagged currently.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Click "Run Duplicate Scan" to execute semantic clustering across all lost and found reports.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((dupGroup, idx) => (
                <div key={dupGroup.groupKey} className="p-4 bg-amber-950/30 border border-amber-900/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-xs">
                      Cluster #{idx + 1}: Category [{dupGroup.category.toUpperCase()}]
                    </span>
                    <span className="text-[10px] text-amber-300 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-full font-semibold">
                      {dupGroup.reason}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dupGroup.reports.map(r => (
                      <div key={r.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{r.title}</span>
                          <span className="font-mono text-emerald-400 font-bold text-[11px]">
                            {r.similarity}% sim
                          </span>
                        </div>
                        <p className="text-slate-400 line-clamp-2">{r.description}</p>
                        <div className="text-[10px] text-slate-500 flex justify-between">
                          <span>Location: {r.location}</span>
                          <span>Date: {r.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Report Moderation */}
      {activeAdminTab === 'reports' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-950 border-b border-slate-800 font-semibold text-white flex justify-between items-center">
            <span>Manage All Indexed Reports</span>
            <span className="text-[11px] text-slate-400">
              Remove spam or inappropriate submissions.
            </span>
          </div>

          <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
            {[...lostReports, ...foundReports].map(report => (
              <div key={report.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      report.type === 'lost' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {report.type}
                    </span>
                    <span className="font-bold text-white">{report.title}</span>
                    <span className="text-slate-500">({report.category})</span>
                  </div>
                  <p className="text-slate-400 line-clamp-1">{report.description}</p>
                  <span className="text-[10px] text-slate-500 block">
                    {report.location} • {report.date}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteReport(report.id)}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-colors shrink-0"
                  title="Delete Report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
