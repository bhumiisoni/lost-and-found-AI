import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  PlusCircle,
  ShieldAlert,
  Bell,
  CheckCircle,
  Cpu,
  FlaskConical,
  Lock,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import { InAppNotification } from '../types';
import { api, HealthInfo } from '../services/api';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  adminToken: string;
  setAdminToken: (token: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  isAdmin,
  setIsAdmin,
  adminToken,
  setAdminToken
}) => {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminInput, setAdminInput] = useState(adminToken || 'admin-campus-key-2026');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => {});
    api.getNotifications().then(setNotifications).catch(() => {});
  }, [currentTab]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminAuth = () => {
    if (adminInput.trim() === 'admin-campus-key-2026') {
      setIsAdmin(true);
      setAdminToken(adminInput.trim());
      setShowAdminModal(false);
    } else {
      alert('Invalid admin passkey. Default test key is: admin-campus-key-2026');
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'report-lost', label: 'Report Lost' },
    { id: 'report-found', label: 'Report Found' },
    { id: 'match', label: 'Find Matches' },
    { id: 'dashboard', label: 'My Dashboard' },
    { id: 'qa-tests', label: 'QA Test Lab' },
    { id: 'admin', label: 'Admin Portal' }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => setCurrentTab('home')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-white tracking-tight text-base sm:text-lg flex items-center gap-1.5">
                  Lost & Found <span className="text-blue-400 font-bold">Assistant</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block -mt-0.5 tracking-wide uppercase">
                  Semantic AI Matching
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const isActive = currentTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setCurrentTab(link.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {link.id === 'qa-tests' && <FlaskConical className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Right utilities */}
            <div className="flex items-center gap-2.5">
              {/* AI Status Badge */}
              <div
                title={health?.geminiConfigured ? 'Server-side Gemini Embedding Model active' : 'Running on high-accuracy local semantic synset fallback'}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-slate-950 border-slate-800 text-slate-300"
              >
                <span className={`w-2 h-2 rounded-full ${health?.geminiConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="truncate max-w-[150px]">
                  {health?.geminiConfigured ? 'Gemini 2.0 AI Active' : 'Semantic Fallback Mode'}
                </span>
              </div>

              {/* Notification Center */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifs(!showNotifs)}
                  aria-label="View notifications"
                  className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 py-2 z-50 text-slate-100">
                    <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">In-App Notifications</span>
                      <span className="text-[11px] text-slate-400">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No notifications yet.</div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition-colors cursor-pointer ${n.read ? 'bg-slate-900 opacity-60' : 'bg-blue-950/40 hover:bg-blue-900/40'}`}
                            onClick={() => handleMarkAsRead(n.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-white">{n.title}</span>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                            </div>
                            <p className="text-slate-300 mt-1">{n.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1.5 block">
                              {new Date(n.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Mode Toggle */}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setIsAdmin(false)}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors"
                  title="Click to switch back to normal user mode"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Admin Active</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Staff Login</span>
                </button>
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 bg-slate-900 border-b border-slate-800 space-y-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => {
                  setCurrentTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentTab === link.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {isAdmin ? 'Staff Mode Active' : 'Standard User Mode'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isAdmin) setIsAdmin(false);
                  else setShowAdminModal(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-blue-400 underline"
              >
                {isAdmin ? 'Exit Staff' : 'Staff Passkey'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Admin Passkey Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 text-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Campus Administrator Login</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Enter the institutional authorization key to access the moderation and claims dashboard.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Authorization Key
                </label>
                <input
                  type="password"
                  value={adminInput}
                  onChange={e => setAdminInput(e.target.value)}
                  placeholder="admin-campus-key-2026"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Demo key prefilled: <code className="bg-slate-800 px-1 rounded text-slate-300">admin-campus-key-2026</code>
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdminAuth}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  Verify & Enter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
