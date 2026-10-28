import React from 'react';
import { ShieldCheck, Compass, Heart, AlertCircle } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-16 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-sm">Lost & Found Assistant</span>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Intelligent contextual item matching system using semantic embeddings, multi-factor scoring, and privacy-first ownership verification. Designed for university campuses, corporate workplaces, and public venues.
            </p>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Campus Security & Facilities Integration</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold text-white mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setCurrentTab('home')} className="hover:text-blue-400 transition-colors">
                  Home Landing
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('report-lost')} className="hover:text-blue-400 transition-colors">
                  Report a Lost Item
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('report-found')} className="hover:text-blue-400 transition-colors">
                  Report a Found Item
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('match')} className="hover:text-blue-400 transition-colors">
                  AI Match Engine & Search
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('qa-tests')} className="hover:text-blue-400 transition-colors">
                  QA Test Lab & Verification
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold text-white mb-3">Safety & Governance</h4>
            <div className="space-y-2 text-[11px] leading-relaxed text-slate-400">
              <p>
                <strong className="text-slate-300">Privacy Policy:</strong> Contact information is masked by default. Claimants must answer secret verification prompts before physical handover.
              </p>
              <p>
                <strong className="text-slate-300">Security Advisory:</strong> Never transfer funds, share one-time passwords (OTPs), or provide banking details to claim an item.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-[11px]">
            &copy; {new Date().getFullYear()} Lost & Found Assistant. Built with Google Gemini API & React.
          </p>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Scores reflect algorithmic semantic similarity, not legal proof of ownership.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
