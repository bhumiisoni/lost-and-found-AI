import React from 'react';
import { LostReport, FoundReport } from '../types';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Tag,
  Palette,
  Package,
  Building,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

interface ItemDetailsModalProps {
  item: LostReport | FoundReport;
  onClose: () => void;
  onInitiateClaim?: (foundItem: FoundReport) => void;
  onFindMatches?: (lostItem: LostReport) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  onClose,
  onInitiateClaim,
  onFindMatches
}) => {
  const isFound = item.type === 'found';
  const foundItem = isFound ? (item as FoundReport) : null;
  const lostItem = !isFound ? (item as LostReport) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 my-8 text-xs text-slate-100">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                isFound
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-blue-950 text-blue-300 border border-blue-800'
              }`}
            >
              {isFound ? 'Found Item' : 'Lost Item'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="capitalize font-medium text-slate-400">{item.category}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Main Title & Image */}
          <div className="flex flex-col sm:flex-row gap-4">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full sm:w-44 h-40 object-cover rounded-xl border border-slate-800 shadow-xs"
              />
            ) : (
              <div className="w-full sm:w-44 h-40 bg-slate-950 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500">
                <Package className="w-8 h-8 mb-1" />
                <span>No Photo Provided</span>
              </div>
            )}

            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-white text-base leading-snug">{item.title}</h3>
              <p className="text-slate-300 leading-relaxed">{item.description}</p>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                {item.color && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
                    <Palette className="w-3 h-3 text-slate-500" />
                    Color: {item.color}
                  </span>
                )}
                {item.brand && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
                    <Tag className="w-3 h-3 text-slate-500" />
                    Brand: {item.brand}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">
                {isFound ? 'Found Location' : 'Last-Seen Location'}
              </span>
              <div className="flex items-center gap-1.5 font-medium text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{item.location}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">
                {isFound ? 'Date Discovered' : 'Date Misplaced'}
              </span>
              <div className="flex items-center gap-1.5 font-medium text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{item.date} at {item.time}</span>
              </div>
            </div>

            {isFound && foundItem?.storageLocation && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">
                  Current Safe Storage Location
                </span>
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{foundItem.storageLocation}</span>
                </div>
              </div>
            )}

            {!isFound && lostItem?.identifyingFeatures && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">
                  Distinguishing Features & Marks
                </span>
                <div className="font-medium text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  {lostItem.identifyingFeatures}
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Safe Contact Note */}
          <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-blue-300">Institutional Privacy Shield:</strong> Reporter contact information is kept private to protect student and employee safety. Physical release requires verification through the campus lost & found protocol.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>

          {isFound && onInitiateClaim && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onInitiateClaim(foundItem!);
              }}
              className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Start Ownership Claim</span>
            </button>
          )}

          {!isFound && onFindMatches && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onFindMatches(lostItem!);
              }}
              className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Find Candidate Matches
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
