import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  LostReport,
  FoundReport,
  ClaimRequest,
  InAppNotification,
  ItemCategory,
  ClaimStatus,
  ReportStatus
} from './src/types';
import {
  INITIAL_LOST_REPORTS,
  INITIAL_FOUND_REPORTS,
  INITIAL_CLAIMS,
  INITIAL_NOTIFICATIONS
} from './src/data/seedData';
import {
  matchLostReport,
  evaluateMatch,
  detectDuplicates,
  getEmbedding
} from './server/matchingEngine';
import { isGeminiConfigured } from './server/geminiClient';
import { runAllTests } from './server/testSuite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory persistent state (seeded with 10+ lost, 12 found, claims, notifications)
let lostReports: LostReport[] = JSON.parse(JSON.stringify(INITIAL_LOST_REPORTS));
let foundReports: FoundReport[] = JSON.parse(JSON.stringify(INITIAL_FOUND_REPORTS));
let claims: ClaimRequest[] = JSON.parse(JSON.stringify(INITIAL_CLAIMS));
let notifications: InAppNotification[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-campus-key-2026';

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const adminToken = req.headers['x-admin-token'];

  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : adminToken;
  if (token === ADMIN_SECRET) {
    next();
  } else {
    res.status(403).json({
      error: 'Forbidden: Valid administrator authentication required.',
      hint: 'Include Authorization: Bearer admin-campus-key-2026 or X-Admin-Token header.'
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '15mb' }));

  // --- API Endpoints ---

  // Health & Model Configuration Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      geminiConfigured: isGeminiConfigured(),
      embeddingModel: isGeminiConfigured() ? 'gemini-embedding-2-preview' : 'tfidf-synset-fallback (Demo Fallback)',
      generationModel: isGeminiConfigured() ? 'gemini-3.8-flash' : 'rule-based contextual synthesis',
      totalLost: lostReports.length,
      totalFound: foundReports.length,
      totalClaims: claims.length,
      timestamp: new Date().toISOString()
    });
  });

  // Overview Statistics
  app.get('/api/stats', (_req: Request, res: Response) => {
    const activeLost = lostReports.filter(r => r.status === 'active').length;
    const activeFound = foundReports.filter(r => r.status === 'active').length;
    const resolvedReports = lostReports.filter(r => r.status === 'resolved').length +
      foundReports.filter(r => r.status === 'resolved').length;
    const pendingClaims = claims.filter(c => c.status === 'pending' || c.status === 'under_review').length;
    const approvedClaims = claims.filter(c => c.status === 'approved' || c.status === 'returned').length;

    res.json({
      totalLost: lostReports.length,
      totalFound: foundReports.length,
      activeLost,
      activeFound,
      resolvedReports,
      pendingClaims,
      approvedClaims,
      geminiActive: isGeminiConfigured()
    });
  });

  // Get all Lost Reports
  app.get('/api/reports/lost', (req: Request, res: Response) => {
    const { category, search, status } = req.query;
    let filtered = [...lostReports];

    if (category && category !== 'all') {
      filtered = filtered.filter(r => r.category === category);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.color.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  });

  // Create Lost Report
  app.post('/api/reports/lost', async (req: Request, res: Response) => {
    try {
      const {
        title,
        category,
        description,
        color,
        brand,
        identifyingFeatures,
        location,
        date,
        time,
        imageUrl,
        contactName,
        contactEmail,
        contactPhone,
        isContactPrivate,
        reward
      } = req.body;

      // Validation
      if (!title || title.trim().length < 3) {
        return res.status(400).json({ error: 'Title is required (at least 3 characters).' });
      }
      if (!description || description.trim().length < 10) {
        return res.status(400).json({ error: 'Detailed description is required (at least 10 characters).' });
      }
      if (!category) {
        return res.status(400).json({ error: 'Item category is required.' });
      }
      if (!location || location.trim().length < 2) {
        return res.status(400).json({ error: 'Last-seen location is required.' });
      }
      if (!contactEmail || !contactEmail.includes('@')) {
        return res.status(400).json({ error: 'Valid contact email is required.' });
      }

      const newReport: LostReport = {
        id: `lost-${Date.now()}`,
        type: 'lost',
        title: title.trim(),
        category: category as ItemCategory,
        description: description.trim(),
        color: color ? color.trim() : 'Unspecified',
        brand: brand ? brand.trim() : '',
        identifyingFeatures: identifyingFeatures ? identifyingFeatures.trim() : '',
        location: location.trim(),
        date: date || new Date().toISOString().split('T')[0],
        time: time || '12:00',
        imageUrl: imageUrl || undefined,
        contactName: contactName ? contactName.trim() : 'Anonymous Reporter',
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone ? contactPhone.trim() : undefined,
        isContactPrivate: isContactPrivate !== false,
        reward: reward ? reward.trim() : undefined,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      lostReports.unshift(newReport);

      // Automatically find matching found candidates
      const matches = await matchLostReport(newReport, foundReports, 45, 5);

      if (matches.length > 0 && matches[0].breakdown.overallScore >= 70) {
        notifications.unshift({
          id: `notif-${Date.now()}`,
          title: `Potential Match Detected (${matches[0].breakdown.overallScore}%)`,
          message: `Your lost report "${newReport.title}" matched with found item "${matches[0].foundReport.title}".`,
          type: 'match_found',
          reportId: newReport.id,
          timestamp: new Date().toISOString(),
          read: false
        });
      }

      res.status(201).json({
        report: newReport,
        matchesCount: matches.length,
        topMatches: matches
      });
    } catch (err) {
      console.error('Error creating lost report:', err);
      res.status(500).json({ error: 'Failed to process report: ' + (err instanceof Error ? err.message : String(err)) });
    }
  });

  // Get all Found Reports
  app.get('/api/reports/found', (req: Request, res: Response) => {
    const { category, search, status } = req.query;
    let filtered = [...foundReports];

    if (category && category !== 'all') {
      filtered = filtered.filter(r => r.category === category);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.color.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  });

  // Create Found Report
  app.post('/api/reports/found', async (req: Request, res: Response) => {
    try {
      const {
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
        imageUrl,
        contactName,
        contactEmail,
        contactPhone,
        isContactPrivate,
        verificationPrompt
      } = req.body;

      if (!title || title.trim().length < 3) {
        return res.status(400).json({ error: 'Title is required (at least 3 characters).' });
      }
      if (!description || description.trim().length < 10) {
        return res.status(400).json({ error: 'Item description is required (at least 10 characters).' });
      }
      if (!category) {
        return res.status(400).json({ error: 'Item category is required.' });
      }
      if (!location || location.trim().length < 2) {
        return res.status(400).json({ error: 'Found location is required.' });
      }

      const newReport: FoundReport = {
        id: `found-${Date.now()}`,
        type: 'found',
        title: title.trim(),
        category: category as ItemCategory,
        description: description.trim(),
        color: color ? color.trim() : 'Unspecified',
        brand: brand ? brand.trim() : '',
        visibleFeatures: visibleFeatures ? visibleFeatures.trim() : '',
        location: location.trim(),
        storageLocation: storageLocation ? storageLocation.trim() : 'Held with finder / Department Reception',
        date: date || new Date().toISOString().split('T')[0],
        time: time || '12:00',
        imageUrl: imageUrl || undefined,
        contactName: contactName ? contactName.trim() : 'Anonymous Finder',
        contactEmail: contactEmail ? contactEmail.trim() : 'lostfound@campus.edu',
        contactPhone: contactPhone ? contactPhone.trim() : undefined,
        isContactPrivate: isContactPrivate !== false,
        verificationPrompt: verificationPrompt ? verificationPrompt.trim() : 'Describe a distinguishing mark or content.',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      foundReports.unshift(newReport);

      // Check if this newly found item matches any active lost items
      const notifyLostUsers: string[] = [];
      for (const lost of lostReports.filter(l => l.status === 'active')) {
        const breakdown = await evaluateMatch(lost, newReport, false);
        if (breakdown.overallScore >= 70) {
          notifyLostUsers.push(lost.title);
          notifications.unshift({
            id: `notif-${Date.now()}-${lost.id}`,
            title: `Potential Match: ${newReport.title}`,
            message: `A found item matches your reported lost "${lost.title}" with ${breakdown.overallScore}% confidence.`,
            type: 'match_found',
            reportId: lost.id,
            timestamp: new Date().toISOString(),
            read: false
          });
        }
      }

      res.status(201).json({
        report: newReport,
        matchedLostReports: notifyLostUsers
      });
    } catch (err) {
      console.error('Error creating found report:', err);
      res.status(500).json({ error: 'Failed to process report: ' + (err instanceof Error ? err.message : String(err)) });
    }
  });

  // Get Single Report
  app.get('/api/reports/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const lost = lostReports.find(r => r.id === id);
    if (lost) return res.json(lost);

    const found = foundReports.find(r => r.id === id);
    if (found) return res.json(found);

    res.status(404).json({ error: 'Report not found.' });
  });

  // Update Report Status
  app.put('/api/reports/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, title, description, location } = req.body;

    const lostIndex = lostReports.findIndex(r => r.id === id);
    if (lostIndex !== -1) {
      if (status) lostReports[lostIndex].status = status as ReportStatus;
      if (title) lostReports[lostIndex].title = title;
      if (description) lostReports[lostIndex].description = description;
      if (location) lostReports[lostIndex].location = location;
      return res.json(lostReports[lostIndex]);
    }

    const foundIndex = foundReports.findIndex(r => r.id === id);
    if (foundIndex !== -1) {
      if (status) foundReports[foundIndex].status = status as ReportStatus;
      if (title) foundReports[foundIndex].title = title;
      if (description) foundReports[foundIndex].description = description;
      if (location) foundReports[foundIndex].location = location;
      return res.json(foundReports[foundIndex]);
    }

    res.status(404).json({ error: 'Report not found.' });
  });

  // Delete / Archive Report
  app.delete('/api/reports/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const lostIdx = lostReports.findIndex(r => r.id === id);
    if (lostIdx !== -1) {
      const removed = lostReports.splice(lostIdx, 1);
      return res.json({ success: true, removed: removed[0] });
    }

    const foundIdx = foundReports.findIndex(r => r.id === id);
    if (foundIdx !== -1) {
      const removed = foundReports.splice(foundIdx, 1);
      return res.json({ success: true, removed: removed[0] });
    }

    res.status(404).json({ error: 'Report not found.' });
  });

  // Match Engine Endpoint: Find matches for a specific Lost Report
  app.post('/api/match', async (req: Request, res: Response) => {
    try {
      const { lostReportId, lostReport, threshold = 40, limit = 5 } = req.body;

      let targetLost: LostReport | undefined;
      if (lostReportId) {
        targetLost = lostReports.find(r => r.id === lostReportId);
      } else if (lostReport) {
        targetLost = lostReport;
      }

      if (!targetLost) {
        return res.status(400).json({ error: 'Must provide either lostReportId or lostReport object.' });
      }

      const matches = await matchLostReport(
        targetLost,
        foundReports,
        Number(threshold),
        Number(limit)
      );

      res.json({
        lostReport: targetLost,
        totalFoundEvaluated: foundReports.length,
        thresholdUsed: Number(threshold),
        matches
      });
    } catch (err) {
      console.error('Matching error:', err);
      res.status(500).json({ error: 'Matching calculation failed: ' + (err instanceof Error ? err.message : String(err)) });
    }
  });

  // Natural Language Search against all Found Reports
  app.post('/api/match/search', async (req: Request, res: Response) => {
    try {
      const { query, category, location, threshold = 35 } = req.body;
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query string is required.' });
      }

      // Synthesize an ephemeral lost report from the search query
      const pseudoLost: LostReport = {
        id: 'search-query',
        type: 'lost',
        title: query.trim(),
        category: (category && category !== 'all' ? category : 'other') as ItemCategory,
        description: query.trim(),
        color: '',
        brand: '',
        identifyingFeatures: '',
        location: location || '',
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        contactName: 'Searcher',
        contactEmail: 'searcher@campus.edu',
        isContactPrivate: true,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      const matches = await matchLostReport(
        pseudoLost,
        foundReports,
        Number(threshold),
        10
      );

      res.json({
        query,
        matches
      });
    } catch (err) {
      console.error('Search match error:', err);
      res.status(500).json({ error: 'Search failed: ' + (err instanceof Error ? err.message : String(err)) });
    }
  });

  // Claims API
  app.get('/api/claims', (_req: Request, res: Response) => {
    res.json(claims);
  });

  app.post('/api/claims', (req: Request, res: Response) => {
    try {
      const {
        foundReportId,
        lostReportId,
        claimantName,
        claimantEmail,
        claimantPhone,
        verificationAnswers
      } = req.body;

      if (!foundReportId) {
        return res.status(400).json({ error: 'Found report ID is required.' });
      }
      if (!claimantName || claimantName.trim().length < 2) {
        return res.status(400).json({ error: 'Claimant full name is required.' });
      }
      if (!claimantEmail || !claimantEmail.includes('@')) {
        return res.status(400).json({ error: 'Valid claimant email is required.' });
      }
      if (!verificationAnswers || verificationAnswers.trim().length < 5) {
        return res.status(400).json({ error: 'Please provide proof/verification answers to establish ownership.' });
      }

      const newClaim: ClaimRequest = {
        id: `claim-${Date.now()}`,
        foundReportId,
        lostReportId: lostReportId || undefined,
        claimantName: claimantName.trim(),
        claimantEmail: claimantEmail.trim(),
        claimantPhone: claimantPhone ? claimantPhone.trim() : '',
        verificationAnswers: verificationAnswers.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      claims.unshift(newClaim);

      notifications.unshift({
        id: `notif-claim-${Date.now()}`,
        title: 'Claim Submitted Successfully',
        message: `Your ownership claim for item #${foundReportId} is pending review by campus administration.`,
        type: 'claim_update',
        timestamp: new Date().toISOString(),
        read: false
      });

      res.status(201).json(newClaim);
    } catch (err) {
      res.status(500).json({ error: 'Claim submission failed.' });
    }
  });

  // Update claim status (Admin / Authorizer)
  app.put('/api/claims/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reviewerNotes } = req.body;

    const claimIndex = claims.findIndex(c => c.id === id);
    if (claimIndex === -1) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (status) {
      claims[claimIndex].status = status as ClaimStatus;
    }
    if (reviewerNotes !== undefined) {
      claims[claimIndex].reviewerNotes = reviewerNotes;
    }
    claims[claimIndex].updatedAt = new Date().toISOString();

    // If approved, update associated reports
    if (status === 'approved') {
      const foundItem = foundReports.find(r => r.id === claims[claimIndex].foundReportId);
      if (foundItem) foundItem.status = 'claimed';
      if (claims[claimIndex].lostReportId) {
        const lostItem = lostReports.find(r => r.id === claims[claimIndex].lostReportId);
        if (lostItem) lostItem.status = 'claimed';
      }
    } else if (status === 'returned') {
      const foundItem = foundReports.find(r => r.id === claims[claimIndex].foundReportId);
      if (foundItem) foundItem.status = 'resolved';
      if (claims[claimIndex].lostReportId) {
        const lostItem = lostReports.find(r => r.id === claims[claimIndex].lostReportId);
        if (lostItem) lostItem.status = 'resolved';
      }
    }

    notifications.unshift({
      id: `notif-claim-update-${Date.now()}`,
      title: `Claim #${id} Status: ${status.toUpperCase()}`,
      message: `Claim review update: ${reviewerNotes || 'Status has been modified by administrator.'}`,
      type: 'claim_update',
      timestamp: new Date().toISOString(),
      read: false
    });

    res.json(claims[claimIndex]);
  });

  // Notifications API
  app.get('/api/notifications', (_req: Request, res: Response) => {
    res.json(notifications);
  });

  app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
    const { id } = req.params;
    const notif = notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      return res.json(notif);
    }
    res.status(404).json({ error: 'Notification not found' });
  });

  // Admin: Duplicate Reports Detection
  app.get('/api/admin/duplicates', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const allReports = [...lostReports, ...foundReports];
      const duplicates = await detectDuplicates(allReports);
      res.json(duplicates);
    } catch (err) {
      res.status(500).json({ error: 'Duplicate detection failed.' });
    }
  });

  // Admin: Reset Seed Data
  app.post('/api/admin/reset-seed', requireAdmin, (_req: Request, res: Response) => {
    lostReports = JSON.parse(JSON.stringify(INITIAL_LOST_REPORTS));
    foundReports = JSON.parse(JSON.stringify(INITIAL_FOUND_REPORTS));
    claims = JSON.parse(JSON.stringify(INITIAL_CLAIMS));
    notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    res.json({ success: true, message: 'Database reset to initial standard dataset with 10 lost and 12 found reports.' });
  });

  // Automated Test Suite Execution
  app.get('/api/test-suite', async (_req: Request, res: Response) => {
    try {
      const results = await runAllTests();
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: 'Test execution failed: ' + (err instanceof Error ? err.message : String(err)) });
    }
  });

  // Mount Vite or Static Distribution
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Lost & Found Assistant] Full-stack Server listening on port ${PORT}`);
    console.log(`[Gemini Integration] Configured: ${isGeminiConfigured()}`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Error:', err);
});
