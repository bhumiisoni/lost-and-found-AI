import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Layers,
  MapPin,
  Calendar,
  Clock,
  Cpu,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { LostReport, FoundReport } from '../types';
import { api, SystemStats, HealthInfo } from '../services/api';

interface HomePageProps {
  setCurrentTab: (tab: string) => void;
  onSelectLostForMatch: (report: LostReport) => void;
  onOpenDetails: (item: LostReport | FoundReport) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setCurrentTab,
  onSelectLostForMatch,
  onOpenDetails
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [recentLost, setRecentLost] = useState<LostReport[]>([]);
  const [recentFound, setRecentFound] = useState<FoundReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, healthData, lostData, foundData] = await Promise.all([
          api.getStats(),
          api.getHealth(),
          api.getLostReports(),
          api.getFoundReports()
        ]);
        setStats(statsData);
        setHealth(healthData);
        setRecentLost(lostData.slice(0, 4));
        setRecentFound(foundData.slice(0, 4));
      } catch (e) {
        console.error('Failed to load home page data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-12 pb-16 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-950 via-slate-900 to-black text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-400/20 text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI-Powered Natural Language Semantic Matching</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Lost Something? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Let's Find It.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Never let mismatched wording stand between you and your belongings. Our semantic intelligence bridges different vocabulary—connecting phrases like <em className="text-blue-300">"dark blue water bottle near the library"</em> with <em className="text-emerald-300">"navy thermal flask outside the reading room"</em> in seconds.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentTab('report-lost')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('report-found')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Report Found Item</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('match')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/50 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-indigo-300" />
              <span>Find Matches</span>
            </button>
          </div>
        </div>

        {/* Live System Status Strip */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Lost Reports</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {stats?.totalLost ?? '--'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Found Reports</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {stats?.totalFound ?? '--'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Active Open Reports</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {(stats?.activeLost || 0) + (stats?.activeFound || 0)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Claims Processed</span>
            <span className="text-2xl font-extrabold text-blue-400 mt-1 block">
              {(stats?.approvedClaims || 0) + (stats?.pendingClaims || 0)}
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Feature Demonstration: How Semantic AI Matching Works */}
      <section className="bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-sm space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Interactive Technology Showcase</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            How Semantic AI Matching Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Traditional keyword search fails when people describe the same item with different vocabulary. Here is how our model solves this:
          </p>
        </div>

        {/* Visual Comparison Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lost report description card */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800">
                Lost Item Report #lost-1
              </span>
              <span className="text-xs text-slate-500">Library 2nd Floor</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-200 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
              "I misplaced my <span className="bg-blue-950 text-blue-300 px-1 rounded font-semibold border border-blue-800">dark blue</span> water bottle near the <span className="bg-amber-950 text-amber-300 px-1 rounded font-semibold border border-amber-800">college library</span>."
            </p>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Category: <strong className="text-slate-300">bottles</strong></div>
              <div>Reported: Oct 24, 2026</div>
            </div>
          </div>

          {/* Found report description card */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                Found Item Report #found-1
              </span>
              <span className="text-xs text-slate-500">Quiet Reading Room</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-200 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
              "A <span className="bg-blue-950 text-blue-300 px-1 rounded font-semibold border border-blue-800">navy-colored</span> flask was discovered outside the <span className="bg-amber-950 text-amber-300 px-1 rounded font-semibold border border-amber-800">reading room</span>."
            </p>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Category: <strong className="text-slate-300">bottles</strong></div>
              <div>Reported: Oct 25, 2026</div>
            </div>
          </div>
        </div>

        {/* Computed Result Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-blue-950/40 border border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
              88%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Strong Candidate
                </span>
                <span className="text-xs text-slate-400">Semantic Cosine Score: 92%</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Identified as a top candidate: "navy" aligns with "dark blue", "flask" aligns with "water bottle", and "reading room" belongs to the campus library zone.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('match')}
            className="px-4 py-2 text-xs font-semibold text-emerald-300 bg-slate-900 hover:bg-slate-800 border border-emerald-700 rounded-lg shadow-xs transition-colors shrink-0"
          >
            Try in Match Engine &rarr;
          </button>
        </div>
      </section>

      {/* Recent Lost Reports */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Lost Reports</h3>
            <p className="text-xs text-slate-400">Items recently reported missing by students and staff</p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTab('match')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>View All & Find Matches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentLost.map(item => (
            <div
              key={item.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-950 text-blue-300 border border-blue-800">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-500">{item.date}</span>
                </div>

                <h4 className="font-bold text-white text-sm line-clamp-1">{item.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>

                <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDetails(item)}
                  className="text-xs font-medium text-slate-400 hover:text-white"
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLostForMatch(item)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-300 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 rounded-lg transition-colors"
                >
                  Match AI
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Found Reports */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Found Items</h3>
            <p className="text-xs text-slate-400">Turned in items waiting for safe verification and claim</p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTab('match')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Search All Found Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentFound.map(item => (
            <div
              key={item.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-500">{item.date}</span>
                </div>

                <h4 className="font-bold text-white text-sm line-clamp-1">{item.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>

                <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDetails(item)}
                  className="text-xs font-medium text-slate-400 hover:text-white"
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetails(item)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 rounded-lg transition-colors"
                >
                  Claim Item
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
