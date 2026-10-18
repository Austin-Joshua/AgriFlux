import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../../../Database/Models/User';
import Report from '../../../Database/Models/Report';
import { env } from '../config/env';

/**
 * Constant-time string comparison to prevent side-channel timing attacks
 */
const verifyTimingSafeKey = (providedKey: string | undefined, expectedKey: string): boolean => {
  if (!providedKey || typeof providedKey !== 'string') return false;
  // Hash both keys to fixed 32-byte SHA-256 digests to eliminate buffer length timing disclosure
  const hashProvided = crypto.createHash('sha256').update(providedKey).digest();
  const hashExpected = crypto.createHash('sha256').update(expectedKey).digest();
  return crypto.timingSafeEqual(hashProvided, hashExpected);
};

/**
 * GET /api/integration/farmer-stats/:identifier
 * Fetches farmer stats for CitizenOne integration.
 * Identifier can be email or phone.
 */
export const getFarmerStats = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const integrationKey = req.headers['x-integration-key'];

    // Security Check: In production, require explicitly configured integration secret
    const configuredKey = process.env.CITIZENONE_INTEGRATION_KEY;
    if (env.NODE_ENV === 'production' && !configuredKey) {
      return res.status(503).json({
        success: false,
        message:
          'Integration service unavailable: CITIZENONE_INTEGRATION_KEY secret not provisioned.',
      });
    }

    const effectiveKey = configuredKey || 'agriflux_default_integration_secret';
    if (!verifyTimingSafeKey(integrationKey as string, effectiveKey)) {
      return res.status(401).json({ success: false, message: 'Invalid integration key' });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    // Fetch latest reports for stats
    const reports = await Report.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10);

    // Aggregate stats
    const stats = {
      farmer: {
        name: user.name,
        farmName: user.farmName,
        location: user.location,
        joinDate: user.createdAt,
      },
      summary: {
        totalReports: await Report.countDocuments({ userId: user._id }),
        latestAnalysis: reports[0]?.content?.analysis || 'No recent analysis available',
        metrics: reports.find((r) => r.type === 'yield')?.content?.metrics || {},
      },
      recentReports: reports.map((r) => ({
        id: r._id,
        type: r.type,
        title: r.title,
        date: r.createdAt,
      })),
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/integration/status
 * Public health check for the integration system.
 */
export const getIntegrationStatus = async (_req: Request, res: Response) => {
  try {
    const isConfigured = Boolean(process.env.CITIZENONE_INTEGRATION_KEY);
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AgriFlux-CitizenOne-Link',
      isReady: isConfigured || env.NODE_ENV !== 'production',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
