import React, { useState } from 'react';
import { TestResultItem } from '../types';
import { api } from '../services/api';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  Clock,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Info,
  AlertTriangle
} from 'lucide-react';

export const TestSuitePage: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResultItem[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [totalPassed, setTotalPassed] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  const handleRunTests = async () => {
    setRunning(true);
    try {
      const data = await api.runTestSuite();
      setResults(data.results);
      setSummary(data.summary);
      setTotalPassed(data.totalPassed);
      setTotalDuration(data.totalDurationMs);
    } catch (err) {
      alert('Failed to execute test suite');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto text-xs text-slate-100">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800 mb-2">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Automated Verification & QA Test Harness</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Testing & Algorithm Audit
        </h1>
        <p className="text-slate-400 mt-1">
          Directly execute backend test assertions verifying semantic paraphrasing, contradictory detail penalties, chronological ordering, form validation, duplicate detection, and RBAC authorization.
        </p>
      </div>

      {/* Test Runner Control Card */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-sm">
            Automated Server-Side Assertion Suite
          </h3>
          <p className="text-slate-400 mt-0.5">
            Executes 8 comprehensive test cases against actual embeddings and data models.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunTests}
          disabled={running}
          className="px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Running Assertions...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Complete Test Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Banner if executed */}
      {summary && (
        <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Execution Summary
            </span>
            <div className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{summary}</span>
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              Pass Rate: <strong className="text-emerald-400">{((totalPassed / results.length) * 100).toFixed(0)}%</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              Duration: <strong className="text-white">{totalDuration}ms</strong>
            </div>
          </div>
        </div>
      )}

      {/* Test Cases List */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">
          Verification Test Cases ({results.length > 0 ? results.length : '8 Defined'})
        </h3>

        {results.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="font-semibold text-slate-300">Test suite ready for execution.</p>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              Click "Run Complete Test Suite" above to invoke the test runner and inspect real-time assertion metrics.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((test, idx) => (
              <div
                key={test.id}
                className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        {test.category}
                      </span>
                      <h4 className="font-bold text-white text-sm">{test.name}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] text-slate-500">
                      Duration: {test.executionTimeMs}ms
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        test.passed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {test.passed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>PASSED</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>FAILED</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <p className="text-slate-400">{test.description}</p>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between gap-2 font-mono text-[11px]">
                  <div className="text-slate-300">
                    <span className="font-semibold text-white font-sans">Assertion: </span>
                    {test.details}
                  </div>
                  {test.actualScore !== undefined && (
                    <div className="text-slate-500 shrink-0">
                      Score: <strong className="text-blue-400">{test.actualScore}%</strong> (Target: {test.expectedScoreThreshold})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Algorithm Architecture Documentation (Prompt Requirement Section 11) */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Matching Algorithm & Scoring Architecture Documentation</span>
        </h3>

        <div className="space-y-3 text-slate-400 leading-relaxed">
          <p>
            The Lost & Found Assistant employs a hybrid natural language understanding and multi-signal scoring model:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <strong className="text-white block mb-1">1. Semantic Embedding Cosine Similarity (50% weight):</strong>
              Converts descriptions into vector representations using <code className="text-blue-300">gemini-embedding-2-preview</code>. Evaluates cosine similarity: <code className="text-slate-300">cos(&theta;) = A &middot; B / (||A|| &times; ||B||)</code>. Captures semantic synonyms (e.g. "dark blue water bottle" vs "navy flask").
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <strong className="text-white block mb-1">2. Category Compatibility (15% weight):</strong>
              Exact category matches score 100%. Compatible groups (e.g. bags & wallets) receive 55%. Incompatible categories (electronics vs jewellery) receive 10%.
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <strong className="text-white block mb-1">3. Color & Brand Synsets (15% weight):</strong>
              Evaluates color clusters (e.g. navy, dark blue, cyan) and brand tokens. Mismatched brands on verified trademarks reduce the confidence score.
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <strong className="text-white block mb-1">4. Campus Location Clusters (10% weight):</strong>
              Clusters related facilities (e.g. library, stacks, reading rooms; dining hall, cafeteria; gym, athletic center).
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 sm:col-span-2">
              <strong className="text-white block mb-1">5. Temporal Feasibility & Contradiction Penalties (10% weight):</strong>
              Items found on or reasonably after the lost date receive full temporal points. Reports where the found date precedes the lost date by weeks or where categories completely clash receive negative penalties (up to -25 pts).
            </div>
          </div>

          <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl text-amber-200 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">Algorithm Limitations:</strong> Similarity scores are statistical indicators of semantic text and contextual relevance. They are not calibrated probabilities of legal ownership. Final verification always requires human validation of private identifying marks.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
