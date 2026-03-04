import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';

export const predictYield = async (req: Request, res: Response) => {
    const data = req.body;

    // In a real app, we'd call the Python script:
    // const pythonScript = path.join(__dirname, '../../ml/predict_yield.py');
    // exec(`python ${pythonScript} '${JSON.stringify(data)}'`, (error, stdout) ...

    // Rule-based engine fallback (same logic as Frontend for consistency in demo)
    const baseYields: any = { Rice: 4500, Wheat: 3800, Corn: 5000 };
    const base = baseYields[data.cropType] || 3000;
    const n = Number(data.nitrogen), p = Number(data.phosphorus), k = Number(data.potassium);

    const predicted = Math.round(base * (n / 100 + p / 50 + k / 60) / 3);

    res.json({
        predicted,
        risk: predicted < base * 0.9 ? 'High' : 'Low',
        suggestions: ['Increase Nitrogen', 'Optimize irrigation']
    });
};

export const irrigationSchedule = async (req: Request, res: Response) => {
    res.json({
        schedule: [
            { day: 'Mon', amount: '20mm' },
            { day: 'Wed', amount: '15mm' },
            { day: 'Fri', amount: '20mm' }
        ]
    });
};

export const soilAnalysis = async (req: Request, res: Response) => {
    res.json({
        score: 85,
        recommendations: ['Add organic compost', 'Balanced NPK']
    });
};

export const climateRisk = async (req: Request, res: Response) => {
    res.json({
        riskScore: 32,
        alerts: [{ type: 'warning', title: 'Heatwave', body: 'Expected next week' }]
    });
};

export const simulateClimate = async (req: Request, res: Response) => {
    const { rainfallChange, tempChange } = req.body;
    const impact = rainfallChange * 0.5 - tempChange * 2;
    res.json({ impact: `${impact > 0 ? '+' : ''}${impact.toFixed(1)}%` });
};
