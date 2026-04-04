import { useState, useEffect, useCallback } from 'react';
import { useRealisticData } from './useRealisticData';

/**
 * useIoT Hook (Simulation Version)
 * Provides real-time soil moisture and relay control data for the AgriFlux Dashboard.
 * Mimics a real ESP32 connection for the hackathon demo.
 */
export const useIoT = () => {
    const data = useRealisticData();
    const [moisture, setMoisture] = useState(data.confidenceScore - 25); // Simulated moisture %
    const [pumpActive, setPumpActive] = useState(false);
    const [lastSync, setLastSync] = useState(new Date());

    // Simulate real-time moisture fluctuations
    useEffect(() => {
        const interval = setInterval(() => {
            setMoisture(prev => {
                // If pump is active, moisture increases
                if (pumpActive) {
                    return Math.min(85, prev + 0.5);
                }
                // Otherwise, it slowly decreases (evaporation/consumption)
                const drift = Math.random() * 0.1;
                return Math.max(20, prev - drift);
            });
            setLastSync(new Date());
        }, 3000);

        return () => clearInterval(interval);
    }, [pumpActive]);

    // Handle relay toggle (software-side simulation)
    const togglePump = useCallback(async () => {
        // Simulate network latency
        await new Promise(r => setTimeout(r, 600));
        setPumpActive(prev => !prev);
        return !pumpActive;
    }, [pumpActive]);

    return {
        moisture: Math.round(moisture * 10) / 10,
        pumpStatus: pumpActive ? 'ON' : 'OFF',
        pumpActive,
        lastSync,
        togglePump,
        isSimulated: true
    };
};
