import React, { useState } from 'react';
import { MatchScoreBreakdown } from '../types';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  Info
} from 'lucide-react';

interface ScoreBreakdownBadgeProps {
  breakdown: MatchScoreBreakdown;
  compact?: boolean;
}

export const ScoreBreakdownBadge: React.FC<ScoreBreakdownBadgeProps> = ({ breakdown, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  const getBadgeStyle = (label: string) => {
    switch (label) {
      case 'Strong Candidate':
        return {
          bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-800',
          dot: 'bg-emerald-400',
          bar: 'bg-emerald-500'
        };
      case 'Possible Match':
        return {
          bg: 'bg-amber-950/70 text-amber-300 border-amber-800',
          dot: 'bg-amber-400',
          bar: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
          bar: 'bg-slate-500'
        };
    }
  };

  const style = getBadgeStyle(breakdown.relevanceLabel);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg}`}>
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
        <span>{breakdown.overallScore}%</span>
        <span className="text-slate-500">•</span>
        <span>{breakdown.relevanceLabel}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden transition-all text-slate-100">
      {/* Header bar */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 shadow-xs font-bold text-lg text-white">
            {breakdown.overallScore}%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                {breakdown.relevanceLabel}
              </span>
              <span className="text-xs text-slate-400">
                Composite Match Score
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-blue-400" />
              <span>Embedding Engine: </span>
              <strong className="font-mono text-slate-200">{breakdown.embeddingMethodUsed}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
        >
          <span>{expanded ? 'Hide Score Breakdown' : 'Explain Match Score'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* AI Explanation preview */}
      <div className="p-4 bg-blue-950/30 border-b border-blue-900/40 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-200 leading-relaxed">
          <span className="font-semibold text-blue-300 mr-1.5">
            {breakdown.isAiGeneratedExplanation ? 'AI Contextual Reasoning (Gemini):' : 'System Synthesis:'}
          </span>
          {breakdown.aiExplanation}
        </div>
      </div>

      {/* Expanded detailed breakdown */}
      {expanded && (
        <div className="p-4 space-y-4 bg-slate-900 text-xs">
          <div>
            <h4 className="font-semibold text-white mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Multi-Factor Weighted Scoring Architecture
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Metric 1 */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">1. Semantic Embedding Similarity (50%)</span>
                  <span className="font-mono font-semibold text-white">{breakdown.semanticScore.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, breakdown.semanticScore)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Vector cosine similarity of natural language descriptions</p>
              </div>

              {/* Metric 2 */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">2. Category Compatibility (15%)</span>
                  <span className="font-mono font-semibold text-white">{breakdown.categoryScore}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, breakdown.categoryScore)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Exact category alignment or related context</p>
              </div>

              {/* Metric 3 */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">3. Color & Brand Alignment (15%)</span>
                  <span className="font-mono font-semibold text-white">{breakdown.colorBrandScore}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, breakdown.colorBrandScore)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Color synonym group + brand token verification</p>
              </div>

              {/* Metric 4 */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">4. Campus Location Proximity (10%)</span>
                  <span className="font-mono font-semibold text-white">{breakdown.locationScore}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, breakdown.locationScore)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Location zone clustering (e.g. library ~ reading room)</p>
              </div>

              {/* Metric 5 */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">5. Date & Time Plausibility (10%)</span>
                  <span className="font-mono font-semibold text-white">{breakdown.dateScore}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, breakdown.dateScore)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Chronological plausibility (found on or after lost date)</p>
              </div>

              {/* Metric 6 - Penalty */}
              {breakdown.penaltyScore !== 0 && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-rose-300 font-medium">Contradiction Penalty</span>
                    <span className="font-mono font-semibold text-rose-300">{breakdown.penaltyScore} pts</span>
                  </div>
                  <p className="text-[10px] text-rose-400">Subtracted due to conflicting core characteristics</p>
                </div>
              )}
            </div>
          </div>

          {/* Shared Characteristics */}
          {breakdown.matchingFactors.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <h5 className="font-semibold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Shared Characteristics & Positive Signals
              </h5>
              <ul className="space-y-1 pl-5 list-disc text-slate-300">
                {breakdown.matchingFactors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Divergent Signals */}
          {breakdown.conflictingFactors.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <h5 className="font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Divergent Signals & Verification Caution
              </h5>
              <ul className="space-y-1 pl-5 list-disc text-slate-300">
                {breakdown.conflictingFactors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300">Transparent System Notice:</strong> Similarity scores are statistical indicators of semantic text and contextual relevance. They are <em>not</em> calibrated legal probabilities of ownership. Please initiate a verified claim request to arrange secure handover.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
