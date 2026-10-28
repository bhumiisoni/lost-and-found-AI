import React, { useState } from 'react';
import { FoundReport, LostReport } from '../types';
import { api } from '../services/api';
import {
  ShieldAlert,
  X,
  CheckCircle2,
  Lock,
  Building,
  Calendar,
  MapPin,
  AlertOctagon
} from 'lucide-react';

interface ClaimModalProps {
  foundItem: FoundReport;
  associatedLostItem?: LostReport;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  foundItem,
  associatedLostItem,
  onClose,
  onSuccess
}) => {
  const [claimantName, setClaimantName] = useState(associatedLostItem?.contactName || '');
  const [claimantEmail, setClaimantEmail] = useState(associatedLostItem?.contactEmail || '');
  const [claimantPhone, setClaimantPhone] = useState(associatedLostItem?.contactPhone || '');
  const [verificationAnswers, setVerificationAnswers] = useState(
    associatedLostItem?.identifyingFeatures ? `My report features: ${associatedLostItem.identifyingFeatures}` : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimantName.trim() || !claimantEmail.trim() || !verificationAnswers.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.submitClaim({
        foundReportId: foundItem.id,
        lostReportId: associatedLostItem?.id,
        claimantName,
        claimantEmail,
        claimantPhone,
        verificationAnswers
      });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 my-8 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800 mb-1.5">
              <Lock className="w-3 h-3" /> Safe Claim Verification
            </div>
            <h3 className="font-bold text-white text-lg">Initiate Ownership Claim</h3>
            <p className="text-xs text-slate-400">
              Submit proof of ownership to campus administrators and the item custodian.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Severe Safety Banner (Prompt Requirement) */}
        <div className="mt-4 p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl flex items-start gap-3 text-xs text-rose-200">
          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block font-semibold mb-0.5 text-rose-300">Critical Privacy & Security Warning:</strong>
            Never disclose account passwords, lock screen passcodes, bank account details, or One-Time Passwords (OTPs). Official campus staff will never ask for payment or sensitive credentials to return an item.
          </div>
        </div>

        {/* Found Item Quick Summary */}
        <div className="mt-4 p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
          <div className="font-semibold text-white text-sm">{foundItem.title}</div>
          <div className="text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              Found: {foundItem.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              Date: {foundItem.date}
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3 text-slate-500" />
              Storage: {foundItem.storageLocation}
            </span>
          </div>
        </div>

        {/* Verification Prompt from finder */}
        {foundItem.verificationPrompt && (
          <div className="mt-3 p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl text-xs">
            <span className="font-semibold text-amber-300 block mb-1">
              Finder's Ownership Verification Question:
            </span>
            <p className="text-amber-200 italic">
              "{foundItem.verificationPrompt}"
            </p>
          </div>
        )}

        {submitted ? (
          <div className="mt-6 p-6 text-center space-y-2 bg-emerald-950/60 rounded-2xl border border-emerald-800 text-emerald-100">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white text-base">Claim Filed Successfully!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Your proof of ownership has been queued for verification. Campus administrators or the item custodian will review your responses and contact you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
            {error && (
              <div className="p-3 bg-rose-950/60 text-rose-300 rounded-lg border border-rose-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={claimantName}
                  onChange={e => setClaimantName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Campus / Personal Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={claimantEmail}
                  onChange={e => setClaimantEmail(e.target.value)}
                  placeholder="alex@campus.edu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Contact Phone (Optional)
              </label>
              <input
                type="tel"
                value={claimantPhone}
                onChange={e => setClaimantPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Ownership Proof & Distinguishing Features <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={verificationAnswers}
                onChange={e => setVerificationAnswers(e.target.value)}
                placeholder="Answer the finder's question above or describe hidden marks, stickers, unique scratches, internal contents, or serial numbers that only the real owner would know."
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Provide specific details visible only upon inspection (e.g., sticker details, inner engravings).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting Claim...' : 'Submit Ownership Claim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
