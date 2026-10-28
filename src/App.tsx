import React, { useState } from 'react';
import { LostReport, FoundReport, MatchCandidate } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ReportLostPage } from './pages/ReportLostPage';
import { ReportFoundPage } from './pages/ReportFoundPage';
import { SearchMatchesPage } from './pages/SearchMatchesPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { TestSuitePage } from './pages/TestSuitePage';
import { ClaimModal } from './components/ClaimModal';
import { ItemDetailsModal } from './components/ItemDetailsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedLostForMatch, setSelectedLostForMatch] = useState<LostReport | null>(null);

  // Admin auth state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('admin-campus-key-2026');

  // Modals state
  const [claimTargetFound, setClaimTargetFound] = useState<FoundReport | null>(null);
  const [claimTargetLost, setClaimTargetLost] = useState<LostReport | undefined>(undefined);
  const [detailsItem, setDetailsItem] = useState<LostReport | FoundReport | null>(null);

  const handleSelectLostForMatch = (report: LostReport) => {
    setSelectedLostForMatch(report);
    setCurrentTab('match');
  };

  const handleInitiateClaim = (foundItem: FoundReport, associatedLost?: LostReport) => {
    setClaimTargetFound(foundItem);
    setClaimTargetLost(associatedLost);
  };

  const handleOpenDetails = (item: LostReport | FoundReport) => {
    setDetailsItem(item);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        adminToken={adminToken}
        setAdminToken={setAdminToken}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentTab === 'home' && (
          <HomePage
            setCurrentTab={setCurrentTab}
            onSelectLostForMatch={handleSelectLostForMatch}
            onOpenDetails={handleOpenDetails}
          />
        )}

        {currentTab === 'report-lost' && (
          <ReportLostPage
            setCurrentTab={setCurrentTab}
            onInitiateClaim={(candidate: MatchCandidate) => {
              handleInitiateClaim(candidate.foundReport);
            }}
          />
        )}

        {currentTab === 'report-found' && (
          <ReportFoundPage
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'match' && (
          <SearchMatchesPage
            initialLostItem={selectedLostForMatch}
            onInitiateClaim={handleInitiateClaim}
            onOpenDetails={handleOpenDetails}
          />
        )}

        {currentTab === 'dashboard' && (
          <UserDashboardPage
            onFindMatches={handleSelectLostForMatch}
            onOpenDetails={handleOpenDetails}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboardPage
            adminToken={adminToken}
            setAdminToken={setAdminToken}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
          />
        )}

        {currentTab === 'qa-tests' && (
          <TestSuitePage />
        )}
      </main>

      {/* Global Modals */}
      {claimTargetFound && (
        <ClaimModal
          foundItem={claimTargetFound}
          associatedLostItem={claimTargetLost}
          onClose={() => setClaimTargetFound(null)}
          onSuccess={() => {
            setClaimTargetFound(null);
            setCurrentTab('dashboard');
          }}
        />
      )}

      {detailsItem && (
        <ItemDetailsModal
          item={detailsItem}
          onClose={() => setDetailsItem(null)}
          onInitiateClaim={(found: FoundReport) => {
            handleInitiateClaim(found);
          }}
          onFindMatches={(lost: LostReport) => {
            handleSelectLostForMatch(lost);
          }}
        />
      )}

      {/* Footer */}
      <Footer setCurrentTab={setCurrentTab} />
    </div>
  );
}
