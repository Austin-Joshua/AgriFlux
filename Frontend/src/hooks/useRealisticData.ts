/**
 * useRealisticData.ts
 * Session-stable realistic agricultural data simulation hook.
 * Values are seeded once per session using useMemo — they stay consistent
 * within a session but vary slightly between page reloads.
 */
import { useMemo } from 'react';

const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const rndF   = (min: number, max: number, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Crop-specific realistic price bands (₹/kg, Indian mandi averages)
const CROP_DATA: Record<string, {
    variety: string;
    priceMin: number; priceMax: number;
    demandMin: number; demandMax: number;
    yieldMin: number;  yieldMax: number;  // kg/ha
    bestMarket: string;
    factors: string[];
}> = {
    Rice:       { variety: 'Sona Masuri', priceMin: 20, priceMax: 28, demandMin: 82, demandMax: 95, yieldMin: 3800, yieldMax: 5200, bestMarket: 'Andhra Pradesh & Telangana Mandis', factors: ['High water availability', 'Loamy soil suitable', 'Strong mandis nearby', 'Seasonal demand peak'] },
    Wheat:      { variety: 'HD-3086', priceMin: 21, priceMax: 27, demandMin: 80, demandMax: 92, yieldMin: 3500, yieldMax: 5000, bestMarket: 'Punjab & Haryana APMCs', factors: ['Neutral soil pH optimal', 'Rabi season timing ideal', 'MSP support available', 'Cold weather favourable'] },
    Cotton:     { variety: 'BT Hybrid', priceMin: 55, priceMax: 72, demandMin: 75, demandMax: 90, yieldMin: 1200, yieldMax: 2200, bestMarket: 'Vidarbha & Gujarat Mandis', factors: ['Black cotton soil detected', 'High moisture retention', 'Export demand rising', 'Price cycle at peak'] },
    Maize:      { variety: 'DHM-117', priceMin: 17, priceMax: 22, demandMin: 70, demandMax: 88, yieldMin: 4200, yieldMax: 6000, bestMarket: 'Karnataka & MP APMCs', factors: ['Moderate rainfall support', 'Good soil drainage', 'Poultry industry demand', 'STAPLE hybrid performance'] },
    Sugarcane:  { variety: 'Co 86032', priceMin: 3,  priceMax: 4,  demandMin: 78, demandMax: 92, yieldMin: 60000,yieldMax: 85000,bestMarket: 'Western UP & Maharashtra', factors: ['Sandy-loam soil ideal', 'River irrigation access', 'Sugar mills proximity', 'Govt quota secured'] },
    Tomatoes:   { variety: 'Arka Rakshak', priceMin: 12, priceMax: 35, demandMin: 72, demandMax: 95, yieldMin: 20000,yieldMax: 40000,bestMarket: 'Kolar (Karnataka) & Nashik', factors: ['Pest resistance noted', 'High storage quality', 'Market shortage detected', 'Climate suitability high'] },
    Soybeans:   { variety: 'JS 335', priceMin: 37, priceMax: 47, demandMin: 73, demandMax: 89, yieldMin: 1800, yieldMax: 2800, bestMarket: 'Madhya Pradesh APMCs', factors: ['Nitrogen fixation active', 'Short duration variety', 'Oil content above average', 'Reliable monsoon cycle'] },
    Onion:      { variety: 'Phule Samarth', priceMin: 10, priceMax: 32, demandMin: 80, demandMax: 96, yieldMin: 15000,yieldMax: 25000,bestMarket: 'Lasalgaon (Nashik), Maharashtra', factors: ['Stable market demand', 'Bulb quality premium', 'Low input cost detected', 'High storage longevity'] },
};

export type CropKey = keyof typeof CROP_DATA;
export const CROP_KEYS = Object.keys(CROP_DATA) as CropKey[];

// Stable Session-wide "Recommended" crop
const SESSION_INDEX = rndInt(0, CROP_KEYS.length - 1);
export const SESSION_CROP = CROP_KEYS[SESSION_INDEX];

export interface RealisticCropData {
    crop: CropKey;
    variety: string;
    priceMin: number;
    priceMax: number;
    demandScore: number;
    yieldKgHa: number;
    bestMarket: string;
    confidenceScore: number;
    soilPh: number;
    humidity: number;
    rainfall: number;
    profitMin: number;
    profitMax: number;
    estimatedCost: number;
    trendLabel: string;
    factors: string[];
}

export function useRealisticData(crop: CropKey = SESSION_CROP): RealisticCropData {
    return useMemo(() => {
        const d = CROP_DATA[crop] ?? CROP_DATA.Rice;

        const priceMin    = rndInt(d.priceMin, d.priceMin + 3);
        const priceMax    = rndInt(d.priceMax - 2, d.priceMax);
        const demandScore = rndInt(d.demandMin, d.demandMax);
        const yieldKgHa   = rndInt(d.yieldMin, d.yieldMax);
        const confidence  = rndInt(88, 97);
        const soilPh      = rndF(6.1, 7.2);
        const humidity    = rndInt(60, 82);
        const rainfall    = rndInt(380, 720);

        // Profit calculated from realistic economics
        const areaHa = 1; // assume ~1 hectare farm for standard metrics
        const revMin  = Math.round(yieldKgHa * areaHa * priceMin / 1000) * 1000;
        const revMax  = Math.round(yieldKgHa * areaHa * priceMax / 1000) * 1000;
        const profitMin = Math.round(revMin * 0.45 / 1000) * 1000; // ~45% margin
        const profitMax = Math.round(revMax * 0.60 / 1000) * 1000; // ~60% margin
        const estimatedCost = revMin - profitMin;

        const trends = [
            'Rising — Export demand increasing',
            'Stable — Seasonal peak approaching',
            'High — Festive season demand surge',
            'Bullish — Low supply in northern markets',
        ];

        return {
            crop,
            variety: d.variety,
            priceMin,
            priceMax,
            demandScore,
            yieldKgHa,
            bestMarket: d.bestMarket,
            confidenceScore: confidence,
            soilPh,
            humidity,
            rainfall,
            profitMin,
            profitMax,
            estimatedCost,
            trendLabel: trends[rndInt(0, trends.length - 1)],
            factors: d.factors,
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crop]); // Compute once per mount OR on crop change
}
