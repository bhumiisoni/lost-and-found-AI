import React, { useState } from 'react';
import { ItemCategory, LostReport, MatchCandidate } from '../types';
import { api } from '../services/api';
import { ScoreBreakdownBadge } from '../components/ScoreBreakdownBadge';
import {
  FileText,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Palette,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  Package
} from 'lucide-react';

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'electronics', label: 'Electronics & Gadgets' },
  { id: 'bags', label: 'Bags & Backpacks' },
  { id: 'clothing', label: 'Clothing & Apparel' },
  { id: 'books', label: 'Books & Textbooks' },
  { id: 'stationery', label: 'Stationery & Pens' },
  { id: 'keys', label: 'Keys & Keychains' },
  { id: 'wallets', label: 'Wallets & Purses' },
  { id: 'bottles', label: 'Bottles & Flasks' },
  { id: 'jewellery', label: 'Jewellery & Watches' },
  { id: 'documents', label: 'Documents & IDs' },
  { id: 'other', label: 'Other Items' }
];

const SAMPLE_IMAGE_PRESETS: { label: string; url: string }[] = [
  { label: 'Water Bottle', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
  { label: 'Wallet', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80' },
  { label: 'Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80' },
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' }
];

interface ReportLostPageProps {
  onReportCreated?: (report: LostReport) => void;
  onInitiateClaim?: (candidate: MatchCandidate) => void;
  setCurrentTab: (tab: string) => void;
}

export const ReportLostPage: React.FC<ReportLostPageProps> = ({
  onReportCreated,
  onInitiateClaim,
  setCurrentTab
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('bottles');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [identifyingFeatures, setIdentifyingFeatures] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [imageUrl, setImageUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isContactPrivate, setIsContactPrivate] = useState(true);
  const [reward, setReward] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<LostReport | null>(null);
  const [topMatches, setTopMatches] = useState<MatchCandidate[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('Please provide a descriptive item title (at least 3 characters).');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please provide a detailed natural-language description (at least 10 characters) for accurate semantic matching.');
      return;
    }
    if (!location.trim()) {
      setError('Please specify where you last saw the item.');
      return;
    }
    if (!contactEmail.includes('@')) {
      setError('Please provide a valid contact email.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createLostReport({
        title,
        category,
        description,
        color,
        brand,
        identifyingFeatures,
        location,
        date,
        time,
        imageUrl: imageUrl || undefined,
        contactName: contactName || 'Student/Staff Reporter',
        contactEmail,
        contactPhone,
        isContactPrivate,
        reward: reward || undefined
      });

      setSubmittedReport(res.report);
      setTopMatches(res.topMatches);
      if (onReportCreated) onReportCreated(res.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-slate-100">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800 mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>Lost Item Intake Protocol</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Report a Lost Item
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Provide natural language details about what you lost. Our AI semantic pipeline will immediately cross-reference all active found reports.
        </p>
      </div>

      {submittedReport ? (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          {/* Success Banner */}
          <div className="p-6 bg-emerald-950/60 rounded-2xl border border-emerald-800 text-emerald-100 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-lg">
              <CheckCircle2 className="w-6 h-6" />
              <span>Lost Report Filed Successfully! (ID: {submittedReport.id})</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              We have indexed your report <strong>"{submittedReport.title}"</strong> and executed instant semantic embedding matching across all campus found items.
            </p>
          </div>

          {/* Instant Candidate Matches Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Instant Match Results ({topMatches.length} candidates found)
                </h3>
                <p className="text-xs text-slate-400">
                  Ranked by multi-factor semantic similarity and contextual signals.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentTab('match')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Full Match Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topMatches.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-500" />
                <p className="font-semibold text-slate-200">No immediate high-confidence matches found yet.</p>
                <p className="max-w-md mx-auto text-slate-400">
                  Don't worry! We have saved your report. As soon as a finder or security desk reports an item with matching characteristics, you will receive an in-app notification.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {topMatches.map((candidate, idx) => (
                  <div
                    key={candidate.foundReport.id}
                    className="p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Candidate #{idx + 1}
                        </span>
                        <h4 className="font-bold text-white text-base">
                          {candidate.foundReport.title}
                        </h4>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>Found at: {candidate.foundReport.location}</span>
                          <span>•</span>
                          <span>Date: {candidate.foundReport.date}</span>
                        </div>
                      </div>

                      {onInitiateClaim && (
                        <button
                          type="button"
                          onClick={() => onInitiateClaim(candidate)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors shrink-0"
                        >
                          Start Ownership Claim
                        </button>
                      )}
                    </div>

                    {/* Breakdown Badge */}
                    <ScoreBreakdownBadge breakdown={candidate.breakdown} />
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setSubmittedReport(null);
                  setTitle('');
                  setDescription('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Submit Another Report
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('dashboard')}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                Go to My Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {error && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Item Core Details */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" />
              <span>1. Item Identification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-300 block mb-1">
                  Item Name / Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Dark Blue Insulated Hydro Flask"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ItemCategory)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Natural Language Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the item naturally in your own words (e.g. 'I misplaced my dark blue water bottle near the college library second floor reading tables. It has a matte finish and a black sip lid with a flexible rubber strap.')."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: The AI semantic model analyzes context, materials, and phrasing—write naturally even if you aren't sure of exact model codes!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  Primary Color(s)
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  placeholder="e.g. Dark blue, navy, silver rim"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Brand / Manufacturer (if known)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Hydro Flask, Apple, Fossil, The North Face"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Unique Identifying Features / Private Ownership Marks
              </label>
              <textarea
                rows={2}
                value={identifyingFeatures}
                onChange={e => setIdentifyingFeatures(e.target.value)}
                placeholder="e.g. Small scratch on bottom rim, sticker of a mountain peak, specific keychain charm, or contents inside."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Last-Seen Location & Time */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>2. Location & Date Last Seen</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="font-semibold text-slate-300 block mb-1">
                  Last-Seen Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. College Library 2nd Floor, Main Cafeteria"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Date Lost
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Approximate Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Optional Image */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <span>3. Optional Photograph / Reference Image</span>
            </h3>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Image Web URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quick Preset Selector */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                Or pick a quick category reference photo:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_IMAGE_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      imageUrl === preset.url
                        ? 'bg-blue-950 border-blue-500 text-blue-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Privacy-Protected Contact Info */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>4. Safe Contact Information</span>
              </h3>
              <div className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  id="privacyToggle"
                  checked={isContactPrivate}
                  onChange={e => setIsContactPrivate(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="privacyToggle" className="cursor-pointer font-medium select-none">
                  Keep details private (Recommended)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="alex.rivera@campus.edu"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Your contact details will only be disclosed to the custodian after an ownership claim is authorized.
            </p>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Analyzing & Cross-referencing...' : 'Submit Report & Scan for Matches'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
