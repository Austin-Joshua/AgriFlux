import { Request, Response } from 'express';
import User from '../models/User';
import Report from '../models/Report';

/**
 * GET /api/integration/farmer-stats/:identifier
 * Fetches farmer stats for CitizenOne integration.
 * Identifier can be email or phone.
 */
export const getFarmerStats = async (req: Request, res: Response) => {
    try {
        const { identifier } = req.params;
        const integrationKey = req.headers['x-integration-key'];

        // Security Check
        const SECRET_KEY = process.env.CITIZENONE_INTEGRATION_KEY || 'agriflux_default_integration_secret';
        if (integrationKey !== SECRET_KEY) {
            return res.status(401).json({ success: false, message: 'Invalid integration key' });
        }

        // Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Farmer not found' });
        }

        // Fetch latest reports for stats
        const reports = await Report.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        // Aggregate stats
        const stats = {
            farmer: {
                name: user.name,
                farmName: user.farmName,
                location: user.location,
                joinDate: user.createdAt
            },
            summary: {
                totalReports: await Report.countDocuments({ userId: user._id }),
                latestAnalysis: reports[0]?.content?.analysis || 'No recent analysis available',
                metrics: reports.find(r => r.type === 'yield')?.content?.metrics || {}
            },
            recentReports: reports.map(r => ({
                id: r._id,
                type: r.type,
                title: r.title,
                date: r.createdAt
            }))
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
