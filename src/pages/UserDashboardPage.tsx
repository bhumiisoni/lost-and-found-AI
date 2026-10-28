import React, { useState, useEffect } from 'react';
import { LostReport, FoundReport, ClaimRequest, InAppNotification } from '../types';
import { api } from '../services/api';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  Trash2,
  ExternalLink,
  Bell,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  Tag
} from 'lucide-react';

interface UserDashboardPageProps {
  onFindMatches: (lostItem: LostReport) => void;
  onOpenDetails: (item: LostReport | FoundReport) => void;
  setCurrentTab: (tab: string) => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  onFindMatches,
  onOpenDetails,
  setCurrentTab
}) => {
  const [activeTab, setActiveTab] = useState<'lost' | 'found' | 'claims' | 'notifications'>('lost');
  const [lostList, setLostList] = useState<LostReport[]>([]);
  const [foundList, setFoundList] = useState<FoundReport[]>([]);
  const [claimsList, setClaimsList] = useState<ClaimRequest[]>([]);
  const [notifsList, setNotifsList] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [losts, founds, claims, notifs] = await Promise.all([
        api.getLostReports(),
        api.getFoundReports(),
        api.getClaims(),
        api.getNotifications()
      ]);
      setLostList(losts);
      setFoundList(founds);
      setClaimsList(claims);
      setNotifsList(notifs);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCloseReport = async (id: string) => {
    if (confirm('Mark this report as resolved/closed?')) {
      try {
        await api.updateReport(id, { status: 'resolved' });
        loadData();
      } catch (e) {
        alert('Failed to update status');
      }
    }
  };

  const getClaimStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">Approved</span>;
      case 'under_review':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">Under Review</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">Rejected</span>;
      case 'returned':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">Item Returned</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">Pending Review</span>;
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto text-xs text-slate-100">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800 mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>My Activity & Reports</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          User Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          Manage your reported items, track pending ownership claims, and check semantic match updates.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('lost')}
          className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'lost'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>My Lost Reports</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {lostList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('found')}
          className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'found'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>My Found Reports</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {foundList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Ownership Claims</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {claimsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Alerts & Notifications</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-950 text-blue-300 border border-blue-800">
            {notifsList.filter(n => !n.read).length} new
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">Loading your activity...</div>
      ) : activeTab === 'lost' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-300">
              Active & Archived Lost Reports ({lostList.length})
            </span>
            <button
              type="button"
              onClick={() => setCurrentTab('report-lost')}
              className="px-3 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              + Report New Lost Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lostList.map(item => (
              <div
                key={item.id}
                className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-950 text-blue-300 border border-blue-800">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1">{item.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.status === 'resolved' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-slate-400 line-clamp-2">{item.description}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {item.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {item.date}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(item)}
                    className="font-medium text-slate-400 hover:text-white"
                  >
                    View Details
                  </button>

                  <div className="flex items-center gap-2">
                    {item.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleCloseReport(item.id)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onFindMatches(item)}
                      className="px-3 py-1 font-semibold text-blue-300 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Find Matches</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'found' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-300">
              Found Items Registered by You ({foundList.length})
            </span>
            <button
              type="button"
              onClick={() => setCurrentTab('report-found')}
              className="px-3 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              + Report Found Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {foundList.map(item => (
              <div
                key={item.id}
                className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1">{item.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.status === 'resolved' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-slate-400 line-clamp-2">{item.description}</p>
                <div className="text-[11px] text-slate-400">
                  Storage custody: <strong className="text-slate-200">{item.storageLocation}</strong>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(item)}
                    className="font-medium text-slate-400 hover:text-white"
                  >
                    View Details
                  </button>
                  {item.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleCloseReport(item.id)}
                      className="px-2.5 py-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                    >
                      Mark Returned
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'claims' ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-950 border-b border-slate-800 font-semibold text-white">
            Ownership Claim Tracker ({claimsList.length})
          </div>
          <div className="divide-y divide-slate-800">
            {claimsList.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No ownership claims submitted yet.</div>
            ) : (
              claimsList.map(claim => (
                <div key={claim.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-sm">Claim #{claim.id}</span>
                      <span className="text-slate-400 ml-2">For Found Item #{claim.foundReportId}</span>
                    </div>
                    {getClaimStatusBadge(claim.status)}
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl text-slate-300 border border-slate-800">
                    <strong className="block text-white mb-1">Submitted Ownership Proof:</strong>
                    "{claim.verificationAnswers}"
                  </div>

                  {claim.reviewerNotes && (
                    <div className="p-2.5 bg-blue-950/60 border border-blue-900 rounded-lg text-blue-200">
                      <strong className="text-blue-300">Administrator Review Notes:</strong> {claim.reviewerNotes}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500">
                    Filed on {new Date(claim.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-950 border-b border-slate-800 font-semibold text-white">
            System Alerts & In-App Notifications
          </div>
          <div className="divide-y divide-slate-800">
            {notifsList.map(n => (
              <div key={n.id} className={`p-4 ${n.read ? 'opacity-60' : 'bg-blue-950/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{n.title}</span>
                  <span className="text-[10px] text-slate-500">{new Date(n.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-300 mt-1">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
