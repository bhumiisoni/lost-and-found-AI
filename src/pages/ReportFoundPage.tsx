import React, { useState } from 'react';
import { ItemCategory, FoundReport } from '../types';
import { api } from '../services/api';
import {
  FileText,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Palette,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  HelpCircle,
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

interface ReportFoundPageProps {
  onReportCreated?: (report: FoundReport) => void;
  setCurrentTab: (tab: string) => void;
}

export const ReportFoundPage: React.FC<ReportFoundPageProps> = ({
  onReportCreated,
  setCurrentTab
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('bottles');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [visibleFeatures, setVisibleFeatures] = useState('');
  const [location, setLocation] = useState('');
  const [storageLocation, setStorageLocation] = useState('Campus Security Desk (Building B)');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [imageUrl, setImageUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isContactPrivate, setIsContactPrivate] = useState(true);
  const [verificationPrompt, setVerificationPrompt] = useState(
    'What specific sticker, engraving, or internal contents were present?'
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<FoundReport | null>(null);
  const [matchedLostUsers, setMatchedLostUsers] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('Please provide a clear title for the found item.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please describe the item (at least 10 characters).');
      return;
    }
    if (!location.trim()) {
      setError('Please specify the location where you discovered the item.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createFoundReport({
        title,
        category,
        description,
        color,
        brand,
        visibleFeatures,
        location,
        storageLocation,
        date,
        time,
        imageUrl: imageUrl || undefined,
        contactName: contactName || 'Helpful Citizen / Campus Custodian',
        contactEmail: contactEmail || 'lostfound@campus.edu',
        contactPhone,
        isContactPrivate,
        verificationPrompt
      });

      setSubmittedReport(res.report);
      setMatchedLostUsers(res.matchedLostReports);
      if (onReportCreated) onReportCreated(res.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-slate-100">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Found Item Intake Protocol</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Report a Found Item
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Thank you for turning in a misplaced item. Registering it here notifies potential owners securely without exposing sensitive personal information.
        </p>
      </div>

      {submittedReport ? (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          <div className="p-6 bg-emerald-950/60 rounded-2xl border border-emerald-800 text-emerald-100 space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-lg">
              <CheckCircle2 className="w-6 h-6" />
              <span>Found Report Created (ID: {submittedReport.id})</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              The item <strong>"{submittedReport.title}"</strong> is now live in the system under safe custody at <em>"{submittedReport.storageLocation}"</em>.
            </p>

            {matchedLostUsers.length > 0 && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-700 text-xs text-emerald-300">
                <span className="font-semibold block mb-1">
                  Automatic AI Cross-Reference Alert:
                </span>
                Our semantic model matched this item with active lost reports ({matchedLostUsers.join(', ')}). The owners have been notified via in-app alerts!
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                setSubmittedReport(null);
                setTitle('');
                setDescription('');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Report Another Found Item
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Back to Home
            </button>
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

          {/* Section 1 */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>1. Found Item Characteristics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-300 block mb-1">
                  Item Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Navy Blue Thermal Beverage Flask"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ItemCategory)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
                Visible Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. A navy-colored insulated flask was discovered outside the quiet reading room hallway on a side ledge. Metallic body with leak-proof screw top."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  placeholder="e.g. Navy blue, silver, black"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Brand / Visible Label
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Hydro Flask, Apple, Ray-Ban, or Unmarked"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Visible External Features
              </label>
              <input
                type="text"
                value={visibleFeatures}
                onChange={e => setVisibleFeatures(e.target.value)}
                placeholder="e.g. Metallic vacuum body, small sticker outline visible"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>2. Location & Safe Custody</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Found Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Quiet Reading Room Corridor, 2nd Level"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Current Safe Storage Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={storageLocation}
                  onChange={e => setStorageLocation(e.target.value)}
                  placeholder="e.g. Library Reception Lost & Found Bin #4, or With Finder"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Date Found
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Time Found
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Safe Verification Question */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>3. Secret Ownership Verification Question</span>
            </h3>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Verification Prompt for Potential Claimants
              </label>
              <input
                type="text"
                required
                value={verificationPrompt}
                onChange={e => setVerificationPrompt(e.target.value)}
                placeholder="e.g. What specific illustration or sticker was placed on the base?"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                To prevent false claims, ask something only the rightful owner would know (e.g. contents of a bag pouch, sticker subject, or lockscreen image).
              </p>
            </div>
          </div>

          {/* Section 4: Optional Photo */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>4. Optional Photo</span>
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
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_IMAGE_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    imageUrl === preset.url
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Registering...' : 'Register Found Item & Notify Owners'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
