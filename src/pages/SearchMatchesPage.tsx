import React, { useState, useEffect } from 'react';
import { LostReport, FoundReport, MatchCandidate, ItemCategory } from '../types';
import { api } from '../services/api';
import { ScoreBreakdownBadge } from '../components/ScoreBreakdownBadge';
import {
  Search,
  Filter,
  Sliders,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Info,
  Package,
  Building,
  UserCheck,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'electronics', label: 'Electronics & Gadgets' },
  { id: 'bags', label: 'Bags & Backpacks' },
  { id: 'clothing', label: 'Clothing & Apparel' },
  { id: 'books', label: 'Books & Textbooks' },
  { id: 'stationery', label: 'Stationery' },
  { id: 'keys', label: 'Keys' },
  { id: 'wallets', label: 'Wallets & Purses' },
  { id: 'bottles', label: 'Bottles & Flasks' },
  { id: 'jewellery', label: 'Jewellery' },
  { id: 'documents', label: 'Documents & IDs' },
  { id: 'other', label: 'Other Items' }
];

interface SearchMatchesPageProps {
  initialLostItem?: LostReport | null;
  onInitiateClaim: (foundItem: FoundReport, associatedLost?: LostReport) => void;
  onOpenDetails: (item: LostReport | FoundReport) => void;
}

export const SearchMatchesPage: React.FC<SearchMatchesPageProps> = ({
  initialLostItem,
  onInitiateClaim,
  onOpenDetails
}) => {
  const [mode, setMode] = useState<'by-lost-item' | 'natural-language'>(
    initialLostItem ? 'by-lost-item' : 'by-lost-item'
  );

  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [selectedLostId, setSelectedLostId] = useState<string>(initialLostItem?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(40);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');

  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load lost reports for dropdown
  useEffect(() => {
    api.getLostReports().then(reports => {
      setLostReports(reports);
      if (!selectedLostId && reports.length > 0) {
        setSelectedLostId(reports[0].id);
      }
    }).catch(console.error);
  }, []);

  // When initialLostItem changes from parent navigation
  useEffect(() => {
    if (initialLostItem) {
      setSelectedLostId(initialLostItem.id);
      setMode('by-lost-item');
    }
  }, [initialLostItem]);

  // Execute match
  const handleExecuteMatch = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      if (mode === 'by-lost-item' && selectedLostId) {
        const res = await api.matchLostItem({
          lostReportId: selectedLostId,
          threshold: threshold,
          limit: 10
        });

        let results = res.matches;
        if (selectedCategory !== 'all') {
          results = results.filter(c => c.foundReport.category === selectedCategory);
        }
        if (selectedLocation) {
          const locLow = selectedLocation.toLowerCase();
          results = results.filter(c => c.foundReport.location.toLowerCase().includes(locLow));
        }

        if (sortBy === 'date') {
          results.sort((a, b) => new Date(b.foundReport.date).getTime() - new Date(a.foundReport.date).getTime());
        } else {
          results.sort((a, b) => b.breakdown.overallScore - a.breakdown.overallScore);
        }

        setCandidates(results);
      } else if (mode === 'natural-language' && searchQuery.trim()) {
        const res = await api.searchFoundItems({
          query: searchQuery,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          location: selectedLocation || undefined,
          threshold: threshold
        });

        let results = res.matches;
        if (sortBy === 'date') {
          results.sort((a, b) => new Date(b.foundReport.date).getTime() - new Date(a.foundReport.date).getTime());
        }
        setCandidates(results);
      }
    } catch (e) {
      console.error('Match search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run when selected lost item or mode switches
  useEffect(() => {
    if (selectedLostId && mode === 'by-lost-item') {
      handleExecuteMatch();
    }
  }, [selectedLostId, mode]);

  const activeLostReport = lostReports.find(r => r.id === selectedLostId);

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto text-slate-100">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Semantic Matching Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Find Candidate Matches
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Compare lost-item reports with found-item descriptions using semantic embeddings, multi-factor weighting, and transparent explanations.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xs space-y-6 text-xs">
        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => setMode('by-lost-item')}
            className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
              mode === 'by-lost-item'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Match from a Lost Report ({lostReports.length} available)
          </button>
          <button
            type="button"
            onClick={() => setMode('natural-language')}
            className={`pb-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
              mode === 'natural-language'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Natural-Language Query Search
          </button>
        </div>

        {/* Input fields according to mode */}
        {mode === 'by-lost-item' ? (
          <div className="space-y-3">
            <label className="font-semibold text-slate-300 block">
              Select Lost Item to Find Matches For:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <select
                  value={selectedLostId}
                  onChange={e => setSelectedLostId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 font-medium text-white bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {lostReports.map(r => (
                    <option key={r.id} value={r.id}>
                      [{r.category.toUpperCase()}] {r.title} — {r.location} ({r.date})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExecuteMatch}
                disabled={loading}
                className="px-5 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Evaluating Vectors...' : 'Run Matching Engine'}</span>
              </button>
            </div>

            {/* Selected Lost Item Preview Card */}
            {activeLostReport && (
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase text-blue-400 tracking-wider">
                    Query Target: {activeLostReport.title}
                  </span>
                  <p className="text-slate-300 mt-0.5 line-clamp-2">
                    "{activeLostReport.description}"
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-400">
                    <span>Category: <strong className="text-slate-300">{activeLostReport.category}</strong></span>
                    <span>Color: <strong className="text-slate-300">{activeLostReport.color || 'Unspecified'}</strong></span>
                    <span>Location: <strong className="text-slate-300">{activeLostReport.location}</strong></span>
                    <span>Date: <strong className="text-slate-300">{activeLostReport.date}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="font-semibold text-slate-300 block">
              Enter Natural-Language Description:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleExecuteMatch()}
                placeholder="e.g. A navy thermal flask left near the quiet library reading room"
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleExecuteMatch}
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              The search matches meaning and concepts, not just exact words. Try synonyms like "spectacles", "backpack", or "macbook".
            </p>
          </div>
        )}

        {/* Filters & Threshold Slider Bar */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          {/* Threshold Slider (Prompt Requirement) */}
          <div className="space-y-1 sm:col-span-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                Relevance Threshold
              </span>
              <strong className="font-mono text-blue-400">{threshold}%</strong>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={threshold}
              onChange={e => {
                setThreshold(Number(e.target.value));
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">
              Lower threshold widens candidates; higher filters strictly.
            </span>
          </div>

          {/* Category Filter */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Category Filter
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Campus Location
            </label>
            <input
              type="text"
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              placeholder="e.g. Library, CS Lab"
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white"
            />
          </div>

          {/* Sort Option */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              Sort Candidates
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'relevance' | 'date')}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white"
            >
              <option value="relevance">Highest Relevance Score</option>
              <option value="date">Most Recently Found</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Ranked Candidate Matches</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
              {candidates.length} returned
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Candidates evaluated against similarity threshold (&ge; {threshold}%)
          </p>
        </div>

        {/* Legal Disclaimer Pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Similarity scores indicate relevance, not calibrated ownership probabilities.</span>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-slate-900 rounded-3xl border border-slate-800">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-300">
            Computing vector embeddings & contextual proximity...
          </p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-slate-900 rounded-3xl border border-slate-800">
          <Package className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="font-bold text-white text-base">No Matching Candidates Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {hasSearched
              ? 'Try lowering the relevance threshold slider (e.g. to 30%) or clearing category/location filters to inspect wider candidates.'
              : 'Select a lost report or type a search query above to view AI-ranked candidates.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {candidates.map((candidate, idx) => {
            const found = candidate.foundReport;
            return (
              <div
                key={found.id}
                className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xs hover:border-slate-700 transition-all overflow-hidden p-6 space-y-5"
              >
                {/* Top Item Summary Strip */}
                <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
                  <div className="flex gap-4">
                    {found.imageUrl ? (
                      <img
                        src={found.imageUrl}
                        alt={found.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Package className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                          Rank #{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {found.category}
                        </span>
                        <span className="text-xs text-slate-500">ID: {found.id}</span>
                      </div>

                      <h3 className="font-bold text-white text-base sm:text-lg">
                        {found.title}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-2 max-w-xl">
                        {found.description}
                      </p>

                      <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          Found: <strong className="text-slate-200">{found.location}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          Date: <strong className="text-slate-200">{found.date}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-emerald-400" />
                          Storage: <strong className="text-slate-200">{found.storageLocation}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => onInitiateClaim(found, activeLostReport)}
                      className="flex-1 sm:flex-none px-4 py-2 font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Start Claim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDetails(found)}
                      className="flex-1 sm:flex-none px-4 py-2 font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-center"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Score Breakdown Component with Transparent Weighting */}
                <ScoreBreakdownBadge breakdown={candidate.breakdown} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
